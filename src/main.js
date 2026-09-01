import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./main/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let prisma;

function initializeDatabase() {
  const databaseDirectory = app.getPath("userData");
  const databasePath = path.join(databaseDirectory, "vendor-billing.db");
  const legacyDatabasePath = path.join(__dirname, "../dev.db");

  fs.mkdirSync(databaseDirectory, { recursive: true });

  if (!fs.existsSync(databasePath) && fs.existsSync(legacyDatabasePath)) {
    fs.copyFileSync(legacyDatabasePath, databasePath);
  }

  return createPrismaClient(databasePath);
}

function getNonNegativeNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }

  return number;
}

function numbersMatch(first, second) {
  return Math.abs(first - second) < 0.000001;
}

function validateInvoice(invoice) {
  if (!invoice || typeof invoice !== "object") {
    throw new Error("Invoice data is required.");
  }

  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    throw new Error("Add at least one product before saving the bill.");
  }

  if (typeof invoice.invoiceNumber !== "string" || !invoice.invoiceNumber.trim()) {
    throw new Error("Invoice number is required.");
  }

  const items = invoice.items.map((item, index) => {
    const itemNumber = index + 1;
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Item ${itemNumber} has an invalid product.`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Item ${itemNumber} must have a quantity greater than zero.`);
    }

    if (typeof item.productName !== "string" || !item.productName.trim()) {
      throw new Error(`Item ${itemNumber} must have a product name.`);
    }

    if (typeof item.unit !== "string" || !item.unit.trim()) {
      throw new Error(`Item ${itemNumber} must have a unit.`);
    }

    const mrp =
      item.mrp === null || item.mrp === undefined
        ? null
        : getNonNegativeNumber(item.mrp, `Item ${itemNumber} MRP`);
    const sellingPrice = getNonNegativeNumber(
      item.sellingPrice,
      `Item ${itemNumber} selling price`,
    );
    const lineTotal = getNonNegativeNumber(
      item.lineTotal,
      `Item ${itemNumber} line total`,
    );

    if (!numbersMatch(lineTotal, sellingPrice * quantity)) {
      throw new Error(`Item ${itemNumber} total does not match its price and quantity.`);
    }

    return {
      productId,
      productName: item.productName.trim(),
      unit: item.unit.trim(),
      quantity,
      mrp,
      sellingPrice,
      lineTotal,
    };
  });

  const totalMrp = getNonNegativeNumber(invoice.totalMrp, "Total MRP");
  const productDiscount = Number(invoice.productDiscount);
  const additionalDiscount = getNonNegativeNumber(
    invoice.additionalDiscount,
    "Additional discount",
  );
  const finalAmount = getNonNegativeNumber(invoice.finalAmount, "Final amount");
  const calculatedTotalMrp = items.reduce(
    (total, item) => total + (item.mrp || 0) * item.quantity,
    0,
  );
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);

  if (!Number.isFinite(productDiscount)) {
    throw new Error("Product discount must be a valid amount.");
  }

  if (!numbersMatch(totalMrp, calculatedTotalMrp)) {
    throw new Error("Total MRP does not match the invoice items.");
  }

  if (!numbersMatch(productDiscount, totalMrp - subtotal)) {
    throw new Error("Product discount does not match the invoice items.");
  }

  if (additionalDiscount > subtotal) {
    throw new Error("Additional discount cannot exceed the subtotal.");
  }

  if (!numbersMatch(finalAmount, subtotal - additionalDiscount)) {
    throw new Error("Final amount does not match the invoice total.");
  }

  return {
    invoiceNumber: invoice.invoiceNumber.trim(),
    totalMrp,
    productDiscount,
    additionalDiscount,
    finalAmount,
    items,
  };
}

function serializeInvoice(invoice) {
  return {
    ...invoice,
    totalMrp: Number(invoice.totalMrp),
    productDiscount: Number(invoice.productDiscount),
    additionalDiscount: Number(invoice.additionalDiscount),
    finalAmount: Number(invoice.finalAmount),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      mrp: item.mrp === null ? null : Number(item.mrp),
      sellingPrice: Number(item.sellingPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}

function parseReportDate(value, endOfDay) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Report dates must use the YYYY-MM-DD format.");
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Report date is invalid.");
  }

  return date;
}

function createSalesReport(invoices) {
  const summary = invoices.reduce(
    (totals, invoice) => ({
      invoiceCount: totals.invoiceCount + 1,
      itemsSold: totals.itemsSold + invoice.items.reduce(
        (count, item) => count + Number(item.quantity),
        0,
      ),
      totalMrp: totals.totalMrp + Number(invoice.totalMrp),
      productDiscount: totals.productDiscount + Number(invoice.productDiscount),
      additionalDiscount:
        totals.additionalDiscount + Number(invoice.additionalDiscount),
      netSales: totals.netSales + Number(invoice.finalAmount),
    }),
    {
      invoiceCount: 0,
      itemsSold: 0,
      totalMrp: 0,
      productDiscount: 0,
      additionalDiscount: 0,
      netSales: 0,
    },
  );

  const products = new Map();

  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const current = products.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantitySold: 0,
        salesAmount: 0,
        invoiceIds: new Set(),
      };

      current.quantitySold += Number(item.quantity);
      current.salesAmount += Number(item.lineTotal);
      current.invoiceIds.add(invoice.id);
      products.set(item.productId, current);
    });
  });

  const productSales = [...products.values()]
    .map(({ invoiceIds, ...product }) => ({
      ...product,
      invoiceCount: invoiceIds.size,
    }))
    .sort((first, second) => second.salesAmount - first.salesAmount);

  return {
    summary,
    invoices: invoices.map(serializeInvoice),
    productSales,
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

ipcMain.handle("products:list", async () => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return products.map((product) => ({
    ...product,
    mrp: product.mrp === null ? null : Number(product.mrp),
    sellingPrice: Number(product.sellingPrice),
  }));
});
ipcMain.handle("products:create", async (_event, product) => {
  const savedProduct = await prisma.product.create({
    data: {
      name: product.name,
      sku: product.sku || null,
      barcode: product.barcode || null,
      category: product.category || null,
      unit: product.unit || "Piece",
      mrp: product.mrp === "" || product.mrp == null ? null : product.mrp,
      sellingPrice: product.sellingPrice,
      isActive: true,
    },
  });

  return {
    ...savedProduct,
    mrp: savedProduct.mrp === null ? null : Number(savedProduct.mrp),
    sellingPrice: Number(savedProduct.sellingPrice),
  };
});
app.whenReady().then(() => {
  prisma = initializeDatabase();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("products:update", async (_event, product) => {
  const updatedProduct = await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      name: product.name,
      sku: product.sku || null,
      barcode: product.barcode || null,
      category: product.category || null,
      unit: product.unit || "Piece",
      mrp: product.mrp === "" || product.mrp == null ? null : product.mrp,
      sellingPrice: product.sellingPrice,
    },
  });

  return {
    ...updatedProduct,
    mrp: updatedProduct.mrp === null ? null : Number(updatedProduct.mrp),
    sellingPrice: Number(updatedProduct.sellingPrice),
  };
});

ipcMain.handle("products:deactivate", async (_event, productId) => {
  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      isActive: false,
    },
  });
});

ipcMain.handle("invoices:create", async (_event, invoice) => {
  const validInvoice = validateInvoice(invoice);

  const savedInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: validInvoice.invoiceNumber,
      totalMrp: validInvoice.totalMrp,
      productDiscount: validInvoice.productDiscount,
      additionalDiscount: validInvoice.additionalDiscount,
      finalAmount: validInvoice.finalAmount,

      items: {
        create: validInvoice.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          quantity: item.quantity,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  return {
    ...serializeInvoice(savedInvoice),
  };
});

ipcMain.handle("invoices:list", async () => {
  const invoices = await prisma.invoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return invoices.map(serializeInvoice);
});

ipcMain.handle("reports:sales", async (_event, filters = {}) => {
  const from = parseReportDate(filters.from, false);
  const to = parseReportDate(filters.to, true);

  if (from && to && from > to) {
    throw new Error("Report start date cannot be after the end date.");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return createSalesReport(invoices);
});
