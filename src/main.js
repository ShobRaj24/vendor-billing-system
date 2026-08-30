import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./main/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("PRODUCTS LIST IPC RECEIVED");

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
  console.log("PRODUCT CREATE IPC RECEIVED:", product);

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

  console.log("PRODUCT CREATED IN PRISMA:", savedProduct);

  return {
    ...savedProduct,
    mrp: savedProduct.mrp === null ? null : Number(savedProduct.mrp),
    sellingPrice: Number(savedProduct.sellingPrice),
  };
});
app.whenReady().then(() => {
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

ipcMain.handle("invoices:create", async (_event, invoice) => {
  console.log("INVOICE CREATE IPC RECEIVED:", invoice);

  const savedInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: invoice.invoiceNumber,
      totalMrp: invoice.totalMrp,
      productDiscount: invoice.productDiscount,
      additionalDiscount: invoice.additionalDiscount,
      finalAmount: invoice.finalAmount,

      items: {
        create: invoice.items.map((item) => ({
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

  console.log("INVOICE CREATED:", savedInvoice);

  return {
    ...savedInvoice,
    totalMrp: Number(savedInvoice.totalMrp),
    productDiscount: Number(savedInvoice.productDiscount),
    additionalDiscount: Number(savedInvoice.additionalDiscount),
    finalAmount: Number(savedInvoice.finalAmount),

    items: savedInvoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      mrp: item.mrp === null ? null : Number(item.mrp),
      sellingPrice: Number(item.sellingPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
});

ipcMain.handle("invoices:list", async () => {
  console.log("INVOICES LIST IPC RECEIVED");

  const invoices = await prisma.invoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return invoices.map((invoice) => ({
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
  }));
});
