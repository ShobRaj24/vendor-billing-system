const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),

    create: (product) => ipcRenderer.invoke("products:create", product),
  },
  invoices: {
    create: (invoice) => ipcRenderer.invoke("invoices:create", invoice),
    list: () => ipcRenderer.invoke("invoices:list"),
  },
});
