const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),

    create: (product) => ipcRenderer.invoke("products:create", product),

    update: (product) => ipcRenderer.invoke("products:update", product),

    deactivate: (productId) =>
      ipcRenderer.invoke("products:deactivate", productId),
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
  reports: {
    sales: (filters) => ipcRenderer.invoke("reports:sales", filters),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (settings) => ipcRenderer.invoke("settings:save", settings),
  },
});
