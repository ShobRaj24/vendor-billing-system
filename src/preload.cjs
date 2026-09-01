const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),

    create: (product) => ipcRenderer.invoke("products:create", product),

    update: (product) => ipcRenderer.invoke("products:update", product),

    deactivate: (productId) =>
      ipcRenderer.invoke("products:deactivate", productId),
  },
  invoices: {
    create: (invoice) => ipcRenderer.invoke("invoices:create", invoice),
    list: () => ipcRenderer.invoke("invoices:list"),
  },
  reports: {
    sales: (filters) => ipcRenderer.invoke("reports:sales", filters),
  },
});
