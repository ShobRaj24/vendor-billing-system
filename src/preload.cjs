const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),
    create: (product) => ipcRenderer.invoke("products:create", product),
    update: (product) => ipcRenderer.invoke("products:update", product),
    deactivate: (productId) =>
      ipcRenderer.invoke("products:deactivate", productId),
    adjustStock: (productId, newStock) =>
      ipcRenderer.invoke("products:adjustStock", { productId, newStock }),
    lowStock: () => ipcRenderer.invoke("products:lowStock"),
  },
  customers: {
    list: (search) => ipcRenderer.invoke("customers:list", search),
    create: (customer) => ipcRenderer.invoke("customers:create", customer),
    update: (customer) => ipcRenderer.invoke("customers:update", customer),
    deactivate: (customerId) =>
      ipcRenderer.invoke("customers:deactivate", customerId),
    invoices: (customerId) =>
      ipcRenderer.invoke("customers:invoices", customerId),
  },
  invoices: {
    create: (invoice) => ipcRenderer.invoke("invoices:create", invoice),
    list: () => ipcRenderer.invoke("invoices:list"),
  },
  suppliers: {
    list: (search) => ipcRenderer.invoke("suppliers:list", search),
    create: (supplier) => ipcRenderer.invoke("suppliers:create", supplier),
    update: (supplier) => ipcRenderer.invoke("suppliers:update", supplier),
    deactivate: (supplierId) =>
      ipcRenderer.invoke("suppliers:deactivate", supplierId),
  },
  purchases: {
    list: () => ipcRenderer.invoke("purchases:list"),
    create: (purchase) => ipcRenderer.invoke("purchases:create", purchase),
  },
  returns: {
    list: () => ipcRenderer.invoke("returns:list"),
    create: (returnData) => ipcRenderer.invoke("returns:create", returnData),
  },
  dashboard: {
    summary: () => ipcRenderer.invoke("dashboard:summary"),
  },
  reports: {
    sales: (filters) => ipcRenderer.invoke("reports:sales", filters),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (settings) => ipcRenderer.invoke("settings:save", settings),
    backup: () => ipcRenderer.invoke("settings:backup"),
  },
});
