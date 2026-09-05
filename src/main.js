import { app, BrowserWindow, ipcMain, dialog } from "electron";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./main/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let prisma;
let sqliteDb;

function hasTable(database, tableName) {
  return Boolean(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName),
  );
}

function hasColumn(database, tableName, columnName) {
  const columns = database.prepare(`PRAGMA table_info("${tableName}")`).all();
  return columns.some((col) => col.name === columnName);
}

function applyCustomerMigration(database) {
  if (hasTable(database, "Customer")) {
    return;
  }

  const migrationPath = path.join(
    __dirname,
    "../prisma/migrations/20260901075959_add_customers/migration.sql",
  );

  if (fs.existsSync(migrationPath)) {
    database.exec(fs.readFileSync(migrationPath, "utf8"));
  }
}

function applyInventoryColumnsMigration(database) {
  if (hasTable(database, "Product")) {
    if (!hasColumn(database, "Product", "stockQuantity")) {
      database.exec('ALTER TABLE "Product" ADD COLUMN "stockQuantity" DECIMAL NOT NULL DEFAULT 0;');
    }
    if (!hasColumn(database, "Product", "lowStockAlert")) {
      database.exec('ALTER TABLE "Product" ADD COLUMN "lowStockAlert" DECIMAL DEFAULT 5;');
    }
    if (!hasColumn(database, "Product", "trackStock")) {
      database.exec('ALTER TABLE "Product" ADD COLUMN "trackStock" BOOLEAN NOT NULL DEFAULT 1;');
    }

    database.exec('UPDATE "Product" SET "stockQuantity" = 0 WHERE "stockQuantity" IS NULL;');
    database.exec('UPDATE "Product" SET "lowStockAlert" = 5 WHERE "lowStockAlert" IS NULL;');
    database.exec('UPDATE "Product" SET "trackStock" = 1 WHERE "trackStock" IS NULL;');
  }
}

function applyPurchasesMigration(database) {
  if (!hasTable(database, "Supplier")) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "Supplier" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "gstin" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  if (!hasTable(database, "Purchase")) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "Purchase" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "purchaseNumber" TEXT NOT NULL UNIQUE,
        "supplierId" INTEGER,
        "supplierName" TEXT NOT NULL DEFAULT 'Cash Supplier',
        "billNumber" TEXT,
        "totalAmount" DECIMAL NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
  }

  if (!hasTable(database, "PurchaseItem")) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "PurchaseItem" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "purchaseId" INTEGER NOT NULL,
        "productId" INTEGER NOT NULL,
        "productName" TEXT NOT NULL,
        "unit" TEXT NOT NULL DEFAULT 'Piece',
        "quantity" DECIMAL NOT NULL,
        "costPrice" DECIMAL NOT NULL,
        "lineTotal" DECIMAL NOT NULL,
        CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
  }
}

function applySalesReturnsMigration(database) {
  if (!hasTable(database, "SalesReturn")) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "SalesReturn" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "returnNumber" TEXT NOT NULL UNIQUE,
        "invoiceId" INTEGER,
        "invoiceNumber" TEXT NOT NULL,
        "customerName" TEXT NOT NULL DEFAULT 'Walk-in Customer',
        "refundAmount" DECIMAL NOT NULL,
        "reason" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SalesReturn_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
  }

  if (!hasTable(database, "SalesReturnItem")) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "SalesReturnItem" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "salesReturnId" INTEGER NOT NULL,
        "productId" INTEGER NOT NULL,
        "productName" TEXT NOT NULL,
        "unit" TEXT NOT NULL DEFAULT 'Piece',
        "quantity" DECIMAL NOT NULL,
        "refundPrice" DECIMAL NOT NULL,
        "lineTotal" DECIMAL NOT NULL,
        CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SalesReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
  }
}

function applyAllMigrations(databasePath) {
  const database = new Database(databasePath);
  try {
    applyCustomerMigration(database);
    applyInventoryColumnsMigration(database);
    applyPurchasesMigration(database);
    applySalesReturnsMigration(database);
  } finally {
    database.close();
  }
}

function initializeDatabase() {
  const databaseDirectory = app.getPath("userData");
  const databasePath = path.join(databaseDirectory, "vendor-billing.db");
  const legacyDatabasePath = path.join(__dirname, "../dev.db");

  fs.mkdirSync(databaseDirectory, { recursive: true });

  if (!fs.existsSync(databasePath) && fs.existsSync(legacyDatabasePath)) {
    fs.copyFileSync(legacyDatabasePath, databasePath);
  }

  applyAllMigrations(databasePath);
  if (fs.existsSync(legacyDatabasePath)) {
    try {
      applyAllMigrations(legacyDatabasePath);
    } catch (err) {
      console.warn("Could not apply migrations to dev.db:", err);
    }
  }

  sqliteDb = new Database(databasePath);
  return createPrismaClient(databasePath);
}

function getNonNegativeNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }

  return number;
}

function validateCustomer(customer) {
  if (!customer || typeof customer !== "object") {
    throw new Error("Customer data is required.");
  }

  const name = typeof customer.name === "string" ? customer.name.trim() : "";
  const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
  const address =
    typeof customer.address === "string" ? customer.address.trim() : "";

  if (!name) {
    throw new Error("Customer name is required.");
  }

  return {
    name,
    phone: phone || null,
    address: address || null,
  };
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
    customerId:
      invoice.customerId === null || invoice.customerId === undefined
        ? null
        : Number(invoice.customerId),
    totalMrp,
    productDiscount,
    additionalDiscount,
    finalAmount,
    items,
  };
}

async function resolveInvoiceCustomer(customerId) {
  if (customerId === null) {
    return {
      customerId: null,
      customerName: "Walk-in Customer",
    };
  }

  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new Error("Invoice customer is invalid.");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      isActive: true,
    },
  });

  if (!customer) {
    throw new Error("Selected customer is unavailable.");
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
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
    width: 1280,
    height: 850,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

/* =========================================================
   IPC HANDLERS: PRODUCTS & INVENTORY
========================================================= */

ipcMain.handle("products:list", async () => {
  const rows = sqliteDb.prepare(`
    SELECT * FROM Product WHERE isActive = 1 ORDER BY name ASC
  `).all();

  return rows.map((p) => ({
    ...p,
    isActive: Boolean(p.isActive),
    trackStock: p.trackStock === undefined ? true : Boolean(p.trackStock),
    mrp: p.mrp === null ? null : Number(p.mrp),
    sellingPrice: Number(p.sellingPrice),
    stockQuantity: Number(p.stockQuantity || 0),
    lowStockAlert: p.lowStockAlert === null ? 5 : Number(p.lowStockAlert),
  }));
});

ipcMain.handle("products:create", async (_event, product) => {
  const mrp = product.mrp === "" || product.mrp == null ? null : Number(product.mrp);
  const sellingPrice = Number(product.sellingPrice);
  const stockQuantity = product.stockQuantity === "" || product.stockQuantity == null ? 0 : Number(product.stockQuantity);
  const lowStockAlert = product.lowStockAlert === "" || product.lowStockAlert == null ? 5 : Number(product.lowStockAlert);
  const trackStock = product.trackStock === false ? 0 : 1;

  const stmt = sqliteDb.prepare(`
    INSERT INTO Product (name, sku, barcode, category, unit, mrp, sellingPrice, stockQuantity, lowStockAlert, trackStock, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  const info = stmt.run(
    product.name.trim(),
    product.sku ? product.sku.trim() : null,
    product.barcode ? product.barcode.trim() : null,
    product.category ? product.category.trim() : null,
    product.unit || "Piece",
    mrp,
    sellingPrice,
    stockQuantity,
    lowStockAlert,
    trackStock,
  );

  const row = sqliteDb.prepare("SELECT * FROM Product WHERE id = ?").get(info.lastInsertRowid);
  return {
    ...row,
    isActive: Boolean(row.isActive),
    trackStock: Boolean(row.trackStock),
    mrp: row.mrp === null ? null : Number(row.mrp),
    sellingPrice: Number(row.sellingPrice),
    stockQuantity: Number(row.stockQuantity || 0),
    lowStockAlert: Number(row.lowStockAlert || 5),
  };
});

ipcMain.handle("products:update", async (_event, product) => {
  const mrp = product.mrp === "" || product.mrp == null ? null : Number(product.mrp);
  const sellingPrice = Number(product.sellingPrice);
  const stockQuantity = product.stockQuantity === "" || product.stockQuantity == null ? 0 : Number(product.stockQuantity);
  const lowStockAlert = product.lowStockAlert === "" || product.lowStockAlert == null ? 5 : Number(product.lowStockAlert);
  const trackStock = product.trackStock === false ? 0 : 1;

  sqliteDb.prepare(`
    UPDATE Product
    SET name = ?, sku = ?, barcode = ?, category = ?, unit = ?, mrp = ?, sellingPrice = ?, stockQuantity = ?, lowStockAlert = ?, trackStock = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(
    product.name.trim(),
    product.sku ? product.sku.trim() : null,
    product.barcode ? product.barcode.trim() : null,
    product.category ? product.category.trim() : null,
    product.unit || "Piece",
    mrp,
    sellingPrice,
    stockQuantity,
    lowStockAlert,
    trackStock,
    product.id,
  );

  const row = sqliteDb.prepare("SELECT * FROM Product WHERE id = ?").get(product.id);
  return {
    ...row,
    isActive: Boolean(row.isActive),
    trackStock: Boolean(row.trackStock),
    mrp: row.mrp === null ? null : Number(row.mrp),
    sellingPrice: Number(row.sellingPrice),
    stockQuantity: Number(row.stockQuantity || 0),
    lowStockAlert: Number(row.lowStockAlert || 5),
  };
});

ipcMain.handle("products:deactivate", async (_event, productId) => {
  sqliteDb.prepare("UPDATE Product SET isActive = 0 WHERE id = ?").run(productId);
});

ipcMain.handle("products:adjustStock", async (_event, arg1, arg2) => {
  const productId =
    typeof arg1 === "object" && arg1 !== null ? Number(arg1.productId) : Number(arg1);
  const newStock =
    typeof arg1 === "object" && arg1 !== null ? Number(arg1.newStock) : Number(arg2);

  if (!Number.isFinite(productId)) throw new Error("Product ID must be a valid number.");
  if (!Number.isFinite(newStock)) throw new Error("Stock quantity must be a valid number.");

  sqliteDb.prepare(`
    UPDATE Product SET stockQuantity = ?, updatedAt = datetime('now') WHERE id = ?
  `).run(newStock, productId);

  const row = sqliteDb.prepare("SELECT * FROM Product WHERE id = ?").get(productId);
  return {
    ...row,
    isActive: Boolean(row.isActive),
    trackStock: Boolean(row.trackStock),
    mrp: row.mrp === null ? null : Number(row.mrp),
    sellingPrice: Number(row.sellingPrice),
    stockQuantity: Number(row.stockQuantity || 0),
    lowStockAlert: Number(row.lowStockAlert || 5),
  };
});

ipcMain.handle("products:lowStock", async () => {
  const rows = sqliteDb.prepare(`
    SELECT * FROM Product WHERE isActive = 1 AND trackStock = 1 AND stockQuantity <= lowStockAlert ORDER BY stockQuantity ASC
  `).all();

  return rows.map((p) => ({
    ...p,
    mrp: p.mrp === null ? null : Number(p.mrp),
    sellingPrice: Number(p.sellingPrice),
    stockQuantity: Number(p.stockQuantity || 0),
    lowStockAlert: Number(p.lowStockAlert || 5),
  }));
});

/* =========================================================
   IPC HANDLERS: CUSTOMERS
========================================================= */

ipcMain.handle("customers:list", async (_event, search = "") => {
  const query = typeof search === "string" ? search.trim() : "";

  return prisma.customer.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: {
      name: "asc",
    },
  });
});

ipcMain.handle("customers:create", async (_event, customer) => {
  return prisma.customer.create({
    data: validateCustomer(customer),
  });
});

ipcMain.handle("customers:update", async (_event, customer) => {
  const customerId = Number(customer?.id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new Error("Customer is invalid.");
  }

  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: validateCustomer(customer),
  });
});

ipcMain.handle("customers:deactivate", async (_event, customerId) => {
  const id = Number(customerId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Customer is invalid.");
  }

  await prisma.customer.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
});

ipcMain.handle("customers:invoices", async (_event, customerId) => {
  const id = Number(customerId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Customer is invalid.");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      customerId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return invoices.map(serializeInvoice);
});

/* =========================================================
   IPC HANDLERS: INVOICES & AUTOMATIC STOCK DEDUCTION
========================================================= */

ipcMain.handle("invoices:create", async (_event, invoice) => {
  const validInvoice = validateInvoice(invoice);
  const customer = await resolveInvoiceCustomer(validInvoice.customerId);

  const savedInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: validInvoice.invoiceNumber,
      customerId: customer.customerId,
      customerName: customer.customerName,
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

  // Automatically deduct stock for tracked products
  const updateStockStmt = sqliteDb.prepare(`
    UPDATE Product SET stockQuantity = COALESCE(stockQuantity, 0) - ?, updatedAt = datetime('now')
    WHERE id = ? AND trackStock = 1
  `);

  for (const item of validInvoice.items) {
    try {
      updateStockStmt.run(item.quantity, item.productId);
    } catch (err) {
      console.warn(`Could not deduct stock for product #${item.productId}:`, err);
    }
  }

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

/* =========================================================
   IPC HANDLERS: SUPPLIERS & PURCHASES (VENDOR INWARD)
========================================================= */

ipcMain.handle("suppliers:list", async (_event, search = "") => {
  const query = typeof search === "string" ? search.trim() : "";
  if (query) {
    return sqliteDb.prepare(`
      SELECT * FROM Supplier WHERE isActive = 1 AND (name LIKE ? OR phone LIKE ?) ORDER BY name ASC
    `).all(`%${query}%`, `%${query}%`);
  }
  return sqliteDb.prepare("SELECT * FROM Supplier WHERE isActive = 1 ORDER BY name ASC").all();
});

ipcMain.handle("suppliers:create", async (_event, supplier) => {
  if (!supplier?.name?.trim()) throw new Error("Supplier name is required.");
  const stmt = sqliteDb.prepare(`
    INSERT INTO Supplier (name, phone, email, address, gstin, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  const info = stmt.run(
    supplier.name.trim(),
    supplier.phone ? supplier.phone.trim() : null,
    supplier.email ? supplier.email.trim() : null,
    supplier.address ? supplier.address.trim() : null,
    supplier.gstin ? supplier.gstin.trim() : null,
  );
  return sqliteDb.prepare("SELECT * FROM Supplier WHERE id = ?").get(info.lastInsertRowid);
});

ipcMain.handle("suppliers:update", async (_event, supplier) => {
  if (!supplier?.id) throw new Error("Supplier ID required");
  if (!supplier?.name?.trim()) throw new Error("Supplier name is required.");
  sqliteDb.prepare(`
    UPDATE Supplier SET name = ?, phone = ?, email = ?, address = ?, gstin = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(
    supplier.name.trim(),
    supplier.phone ? supplier.phone.trim() : null,
    supplier.email ? supplier.email.trim() : null,
    supplier.address ? supplier.address.trim() : null,
    supplier.gstin ? supplier.gstin.trim() : null,
    supplier.id,
  );
  return sqliteDb.prepare("SELECT * FROM Supplier WHERE id = ?").get(supplier.id);
});

ipcMain.handle("suppliers:deactivate", async (_event, supplierId) => {
  sqliteDb.prepare("UPDATE Supplier SET isActive = 0 WHERE id = ?").run(supplierId);
});

ipcMain.handle("purchases:list", async () => {
  const purchases = sqliteDb.prepare("SELECT * FROM Purchase ORDER BY createdAt DESC").all();
  const getItems = sqliteDb.prepare("SELECT * FROM PurchaseItem WHERE purchaseId = ?");
  return purchases.map((p) => ({
    ...p,
    totalAmount: Number(p.totalAmount),
    items: getItems.all(p.id).map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      costPrice: Number(i.costPrice),
      lineTotal: Number(i.lineTotal),
    })),
  }));
});

ipcMain.handle("purchases:create", async (_event, purchase) => {
  if (!purchase.items || purchase.items.length === 0) {
    throw new Error("Add at least one item to inward purchase.");
  }
  const purchaseNumber = `PUR-${Date.now()}`;
  const totalAmount = purchase.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.costPrice),
    0,
  );

  const insertPurchase = sqliteDb.prepare(`
    INSERT INTO Purchase (purchaseNumber, supplierId, supplierName, billNumber, totalAmount, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertItem = sqliteDb.prepare(`
    INSERT INTO PurchaseItem (purchaseId, productId, productName, unit, quantity, costPrice, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const updateProductStock = sqliteDb.prepare(`
    UPDATE Product SET stockQuantity = COALESCE(stockQuantity, 0) + ?, updatedAt = datetime('now') WHERE id = ?
  `);

  const transaction = sqliteDb.transaction(() => {
    const info = insertPurchase.run(
      purchaseNumber,
      purchase.supplierId || null,
      purchase.supplierName || "Cash Supplier",
      purchase.billNumber || null,
      totalAmount,
      purchase.notes || null,
    );
    const purchaseId = info.lastInsertRowid;

    for (const item of purchase.items) {
      const qty = Number(item.quantity);
      const cost = Number(item.costPrice);
      const lineTotal = qty * cost;
      insertItem.run(
        purchaseId,
        item.productId,
        item.productName,
        item.unit || "Piece",
        qty,
        cost,
        lineTotal,
      );
      updateProductStock.run(qty, item.productId);
    }
    return purchaseId;
  });

  const createdId = transaction();
  const created = sqliteDb.prepare("SELECT * FROM Purchase WHERE id = ?").get(createdId);
  const items = sqliteDb.prepare("SELECT * FROM PurchaseItem WHERE purchaseId = ?").all(createdId);

  return {
    ...created,
    totalAmount: Number(created.totalAmount),
    items: items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      costPrice: Number(i.costPrice),
      lineTotal: Number(i.lineTotal),
    })),
  };
});

/* =========================================================
   IPC HANDLERS: SALES RETURNS (CREDIT NOTES)
========================================================= */

ipcMain.handle("returns:list", async () => {
  const returns = sqliteDb.prepare("SELECT * FROM SalesReturn ORDER BY createdAt DESC").all();
  const getItems = sqliteDb.prepare("SELECT * FROM SalesReturnItem WHERE salesReturnId = ?");
  return returns.map((r) => ({
    ...r,
    refundAmount: Number(r.refundAmount),
    items: getItems.all(r.id).map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      refundPrice: Number(i.refundPrice),
      lineTotal: Number(i.lineTotal),
    })),
  }));
});

ipcMain.handle("returns:create", async (_event, returnData) => {
  if (!returnData.items || returnData.items.length === 0) {
    throw new Error("Add at least one item to return.");
  }
  const returnNumber = `RET-${Date.now()}`;
  const refundAmount = returnData.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.refundPrice),
    0,
  );

  const insertReturn = sqliteDb.prepare(`
    INSERT INTO SalesReturn (returnNumber, invoiceId, invoiceNumber, customerName, refundAmount, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertItem = sqliteDb.prepare(`
    INSERT INTO SalesReturnItem (salesReturnId, productId, productName, unit, quantity, refundPrice, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const restockProduct = sqliteDb.prepare(`
    UPDATE Product SET stockQuantity = COALESCE(stockQuantity, 0) + ?, updatedAt = datetime('now') WHERE id = ?
  `);

  const transaction = sqliteDb.transaction(() => {
    const info = insertReturn.run(
      returnNumber,
      returnData.invoiceId || null,
      returnData.invoiceNumber || "",
      returnData.customerName || "Walk-in Customer",
      refundAmount,
      returnData.reason || null,
    );
    const returnId = info.lastInsertRowid;

    for (const item of returnData.items) {
      const qty = Number(item.quantity);
      const price = Number(item.refundPrice);
      const lineTotal = qty * price;
      insertItem.run(
        returnId,
        item.productId,
        item.productName,
        item.unit || "Piece",
        qty,
        price,
        lineTotal,
      );
      restockProduct.run(qty, item.productId);
    }
    return returnId;
  });

  const createdId = transaction();
  const created = sqliteDb.prepare("SELECT * FROM SalesReturn WHERE id = ?").get(createdId);
  const items = sqliteDb.prepare("SELECT * FROM SalesReturnItem WHERE salesReturnId = ?").all(createdId);

  return {
    ...created,
    refundAmount: Number(created.refundAmount),
    items: items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      refundPrice: Number(i.refundPrice),
      lineTotal: Number(i.lineTotal),
    })),
  };
});

/* =========================================================
   IPC HANDLERS: DASHBOARD & REPORTS
========================================================= */

ipcMain.handle("dashboard:summary", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStartStr = today.toISOString();

  const todayInvoices = sqliteDb.prepare(`
    SELECT * FROM Invoice WHERE createdAt >= ? ORDER BY createdAt DESC
  `).all(todayStartStr);

  const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount), 0);
  const todayInvoiceCount = todayInvoices.length;

  const lowStockProducts = sqliteDb.prepare(`
    SELECT * FROM Product WHERE isActive = 1 AND trackStock = 1 AND stockQuantity <= lowStockAlert ORDER BY stockQuantity ASC LIMIT 8
  `).all().map((p) => ({
    ...p,
    mrp: p.mrp === null ? null : Number(p.mrp),
    sellingPrice: Number(p.sellingPrice),
    stockQuantity: Number(p.stockQuantity || 0),
    lowStockAlert: Number(p.lowStockAlert || 5),
  }));

  const totalLowStockCount = sqliteDb.prepare(`
    SELECT COUNT(*) as count FROM Product WHERE isActive = 1 AND trackStock = 1 AND stockQuantity <= lowStockAlert
  `).get().count;

  const totalProducts = sqliteDb.prepare("SELECT COUNT(*) as count FROM Product WHERE isActive = 1").get().count;
  const totalCustomers = sqliteDb.prepare("SELECT COUNT(*) as count FROM Customer WHERE isActive = 1").get().count;

  const recentInvoices = todayInvoices.slice(0, 5).map((inv) => ({
    ...inv,
    finalAmount: Number(inv.finalAmount),
  }));

  return {
    todaySales,
    todayInvoiceCount,
    lowStockProducts,
    totalLowStockCount,
    totalProducts,
    totalCustomers,
    recentInvoices,
  };
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

/* =========================================================
   IPC HANDLERS: SETTINGS & DATABASE BACKUP
========================================================= */

const defaultSettings = {
  storeName: "Vendor Billing",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  invoicePrefix: "INV-",
  receiptHeader: "Tax Invoice",
  receiptFooter: "Thank you for your business. Please visit again.",
  defaultPrintFormat: "A4",
  currencySymbol: "₹",
};

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  const settingsPath = getSettingsPath();
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      return { ...defaultSettings, ...data };
    }
  } catch (error) {
    console.error("Failed to read settings file:", error);
  }
  return { ...defaultSettings };
}

function writeSettings(newSettings) {
  const settingsPath = getSettingsPath();
  const current = readSettings();
  const merged = {
    ...current,
    ...newSettings,
    storeName:
      typeof newSettings.storeName === "string" && newSettings.storeName.trim()
        ? newSettings.storeName.trim()
        : defaultSettings.storeName,
    phone: typeof newSettings.phone === "string" ? newSettings.phone.trim() : "",
    email: typeof newSettings.email === "string" ? newSettings.email.trim() : "",
    address:
      typeof newSettings.address === "string" ? newSettings.address.trim() : "",
    gstin: typeof newSettings.gstin === "string" ? newSettings.gstin.trim() : "",
    invoicePrefix:
      typeof newSettings.invoicePrefix === "string" && newSettings.invoicePrefix.trim()
        ? newSettings.invoicePrefix.trim()
        : defaultSettings.invoicePrefix,
    receiptHeader:
      typeof newSettings.receiptHeader === "string"
        ? newSettings.receiptHeader.trim()
        : defaultSettings.receiptHeader,
    receiptFooter:
      typeof newSettings.receiptFooter === "string"
        ? newSettings.receiptFooter.trim()
        : defaultSettings.receiptFooter,
    defaultPrintFormat: ["A4", "80mm", "58mm"].includes(
      newSettings.defaultPrintFormat,
    )
      ? newSettings.defaultPrintFormat
      : "A4",
    currencySymbol:
      typeof newSettings.currencySymbol === "string" &&
      newSettings.currencySymbol.trim()
        ? newSettings.currencySymbol.trim()
        : defaultSettings.currencySymbol,
  };

  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

ipcMain.handle("settings:get", async () => {
  return readSettings();
});

ipcMain.handle("settings:save", async (_event, newSettings) => {
  return writeSettings(newSettings);
});

ipcMain.handle("settings:backup", async () => {
  const dbPath = path.join(app.getPath("userData"), "vendor-billing.db");
  if (!fs.existsSync(dbPath)) {
    throw new Error("Database file not found.");
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save Vendor Billing Database Backup",
    defaultPath: `vendor-billing-backup-${dateStr}.db`,
    filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
  });

  if (canceled || !filePath) return { canceled: true };

  fs.copyFileSync(dbPath, filePath);
  return { success: true, filePath };
});

/* =========================================================
   APP LIFECYCLE
========================================================= */

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
