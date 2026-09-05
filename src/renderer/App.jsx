import { useEffect, useMemo, useState } from "react";
import AddProductForm from "./components/AddProductForm";
import ProductSearch from "./components/ProductSearch";
import BillItems from "./components/BillItems";
import BillSummary from "./components/BillSummary";
import { useBilling } from "./hooks/useBilling";
import InvoiceHistory from "./components/InvoiceHistory";
import InvoicePreview from "./components/InvoicePreview";
import ProductManagement from "./components/ProductManagement";
import ReportsPage from "./components/ReportsPage";
import CustomerManagement from "./components/CustomerManagement";
import CustomerSelector from "./components/CustomerSelector";
import SettingsPage from "./components/SettingsPage";
import HeldBillsModal from "./components/HeldBillsModal";
import DashboardPage from "./components/DashboardPage";
import PurchasesPage from "./components/PurchasesPage";

function App() {
  const [search, setSearch] = useState("");
  const {
    billItems,
    additionalDiscount,
    setAdditionalDiscount,
    addProduct,
    updateQuantity,
    updatePrice,
    removeItem,
    totalMrp,
    subtotal,
    productDiscount,
    saveBill,
    resetBill,
    loadBill,
    billSaved,
  } = useBilling();
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [billSaveError, setBillSaveError] = useState("");
  const [billNotice, setBillNotice] = useState("");
  const [productSaved, setProductSaved] = useState(false);
  const [productSaveError, setProductSaveError] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    unit: "Piece",
    mrp: "",
    sellingPrice: "",
    stockQuantity: "0",
    lowStockAlert: "5",
    trackStock: true,
  });
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [invoicePreviewSource, setInvoicePreviewSource] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Settings state
  const [settings, setSettings] = useState(null);

  // Held bills state
  const [heldBills, setHeldBills] = useState(() => {
    try {
      const saved = localStorage.getItem("vendor_held_bills");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await window.api.settings.get();
        if (s) setSettings(s);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadSettings();
  }, []);

  function saveHeldBills(updated) {
    setHeldBills(updated);
    try {
      localStorage.setItem("vendor_held_bills", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save held bills:", err);
    }
  }

  function handleHoldBill() {
    if (billItems.length === 0) {
      setBillSaveError("Cannot hold an empty bill. Add products first.");
      setTimeout(() => setBillSaveError(""), 3500);
      return;
    }

    const newHeld = {
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      heldAt: Date.now(),
      items: [...billItems],
      additionalDiscount: additionalDiscount || "",
      customer: selectedCustomer ? { ...selectedCustomer } : null,
      finalAmount: subtotal - Number(additionalDiscount || 0),
    };

    saveHeldBills([newHeld, ...heldBills]);
    resetBill();
    setSelectedCustomer(null);
    setBillSaveError("");
    setBillNotice("Bill placed on hold.");
    setTimeout(() => setBillNotice(""), 3500);
  }

  function handleResume(billToResume) {
    loadBill(billToResume.items, billToResume.additionalDiscount);
    setSelectedCustomer(billToResume.customer || null);
    saveHeldBills(heldBills.filter((b) => b.id !== billToResume.id));
    setShowHeldBillsModal(false);
    setCurrentPage("billing");
    setBillNotice("Resumed held bill.");
    setTimeout(() => setBillNotice(""), 3500);
  }

  function handleResumeWithHold(billToResume) {
    const activeHeld = {
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      heldAt: Date.now(),
      items: [...billItems],
      additionalDiscount: additionalDiscount || "",
      customer: selectedCustomer ? { ...selectedCustomer } : null,
      finalAmount: subtotal - Number(additionalDiscount || 0),
    };
    const remaining = heldBills.filter((b) => b.id !== billToResume.id);
    saveHeldBills([activeHeld, ...remaining]);

    loadBill(billToResume.items, billToResume.additionalDiscount);
    setSelectedCustomer(billToResume.customer || null);
    setShowHeldBillsModal(false);
    setCurrentPage("billing");
    setBillNotice("Active bill placed on hold & selected bill resumed.");
    setTimeout(() => setBillNotice(""), 3500);
  }

  function handleResumeWithDiscard(billToResume) {
    saveHeldBills(heldBills.filter((b) => b.id !== billToResume.id));
    loadBill(billToResume.items, billToResume.additionalDiscount);
    setSelectedCustomer(billToResume.customer || null);
    setShowHeldBillsModal(false);
    setCurrentPage("billing");
    setBillNotice("Active bill discarded & selected bill resumed.");
    setTimeout(() => setBillNotice(""), 3500);
  }

  function handleDiscardHeldBill(id) {
    saveHeldBills(heldBills.filter((b) => b.id !== id));
  }

  function handleClearAllHeldBills() {
    saveHeldBills([]);
  }

  function updateNewProduct(field, value) {
    setProductSaveError("");
    setNewProduct((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProduct() {
    if (!newProduct.name.trim()) {
      setProductSaveError("Product name is required.");
      return;
    }

    if (newProduct.sellingPrice === "" || Number(newProduct.sellingPrice) < 0) {
      setProductSaveError("Selling price is required.");
      return;
    }

    try {
      const savedProduct = await window.api.products.create({
        ...newProduct,
        sellingPrice: Number(newProduct.sellingPrice),
        mrp: newProduct.mrp === "" ? null : Number(newProduct.mrp),
        stockQuantity: Number(newProduct.stockQuantity || 0),
        lowStockAlert: Number(newProduct.lowStockAlert || 5),
        trackStock: newProduct.trackStock !== false,
      });
      setProducts((currentProducts) => [savedProduct, ...currentProducts]);
      setProductSaveError("");

      setNewProduct({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        unit: "Piece",
        mrp: "",
        sellingPrice: "",
        stockQuantity: "0",
        lowStockAlert: "5",
        trackStock: true,
      });

      setProductSaved(true);

      setTimeout(() => {
        setProductSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save product:", error);
      setProductSaveError(error?.message || String(error));
    }
  }

  async function createProductFromProductsPage(product) {
    const savedProduct = await window.api.products.create({
      ...product,
      sellingPrice: Number(product.sellingPrice),
      mrp: product.mrp === "" ? null : Number(product.mrp),
      stockQuantity: Number(product.stockQuantity || 0),
      lowStockAlert: Number(product.lowStockAlert || 5),
      trackStock: product.trackStock !== false,
    });

    setProducts((currentProducts) => [savedProduct, ...currentProducts]);
  }

  async function deleteProduct(product) {
    const shouldDelete = window.confirm(
      `Remove "${product.name}" from the active products list?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await window.api.products.deactivate(product.id);
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      );
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(`Could not delete product.\n\n${error?.message || error}`);
    }
  }

  async function updateProductFromProductsPage(productId, product) {
    const updatedProduct = await window.api.products.update({
      id: productId,
      ...product,
      sellingPrice: Number(product.sellingPrice),
      mrp: product.mrp === "" ? null : Number(product.mrp),
      stockQuantity: Number(product.stockQuantity || 0),
      lowStockAlert: Number(product.lowStockAlert || 5),
      trackStock: product.trackStock !== false,
    });

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
      ),
    );
  }

  async function loadProducts() {
    try {
      const result = await window.api.products.list();
      setProducts(result);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAdjustStock(productId, quantity) {
    await window.api.products.adjustStock(productId, quantity);
    await loadProducts();
  }

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) =>
      product.name.toLowerCase().includes(value),
    );
  }, [search, products]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h1 className="text-xl font-bold truncate">
            {settings?.storeName || "Vendor Billing"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">Billing & POS</p>
        </div>

        <nav className="flex-1 p-3">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "dashboard"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setCurrentPage("billing")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "billing"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            🧾 New Bill
          </button>
          <button
            onClick={() => setCurrentPage("products")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "products"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            📦 Products & Stock
          </button>
          <button
            onClick={() => setCurrentPage("purchases")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "purchases"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            🛒 Purchases
          </button>
          <button
            onClick={() => setCurrentPage("invoices")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "invoices"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            📚 Invoices
          </button>
          <button
            onClick={() => setCurrentPage("reports")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "reports"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            📈 Reports
          </button>
          <button
            onClick={() => setCurrentPage("customers")}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "customers"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            👥 Customers
          </button>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={() => setCurrentPage("settings")}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "settings"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            ⚙️ Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {savedInvoice ? (
          <InvoicePreview
            invoice={savedInvoice}
            settings={settings}
            onProductStockUpdated={loadProducts}
            onBack={() => {
              setSavedInvoice(null);
              const source = invoicePreviewSource;
              setInvoicePreviewSource(null);

              if (source === "history") {
                setCurrentPage("invoices");
              } else if (source === "reports") {
                setCurrentPage("reports");
              } else if (source === "dashboard") {
                setCurrentPage("dashboard");
              } else {
                setCurrentPage("billing");
              }
            }}
          />
        ) : currentPage === "dashboard" ? (
          <DashboardPage
            onNavigate={(page) => setCurrentPage(page)}
            onOpenInvoice={(invoice) => {
              setSavedInvoice(invoice);
              setInvoicePreviewSource("dashboard");
            }}
          />
        ) : currentPage === "purchases" ? (
          <PurchasesPage
            products={products}
            onProductStockUpdated={loadProducts}
          />
        ) : currentPage === "settings" ? (
          <SettingsPage
            onSettingsSaved={(updated) => {
              setSettings(updated);
            }}
          />
        ) : currentPage === "customers" ? (
          <CustomerManagement />
        ) : currentPage === "reports" ? (
          <ReportsPage
            onOpenInvoice={(invoice) => {
              setSavedInvoice(invoice);
              setInvoicePreviewSource("reports");
            }}
          />
        ) : currentPage === "invoices" ? (
          <InvoiceHistory
            onOpenInvoice={(invoice) => {
              setSavedInvoice(invoice);
              setInvoicePreviewSource("history");
            }}
          />
        ) : currentPage === "products" ? (
          <ProductManagement
            products={products}
            onCreateProduct={createProductFromProductsPage}
            onUpdateProduct={updateProductFromProductsPage}
            onAdjustStock={handleAdjustStock}
            onDelete={deleteProduct}
          />
        ) : (
          <>
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
              <div>
                <h2 className="text-lg font-semibold">New Bill</h2>
                <p className="text-xs text-slate-500">
                  Scan or search products to begin
                </p>
              </div>

              <div className="flex items-center gap-3">
                {heldBills.length > 0 && (
                  <button
                    onClick={() => setShowHeldBillsModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100"
                  >
                    <span>⏸ Held Bills</span>
                    <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] text-amber-900">
                      {heldBills.length}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setShowAddProduct(true)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  + Add Product
                </button>
              </div>
            </header>

            {showAddProduct && (
              <div className="px-6 pt-4">
                <AddProductForm
                  newProduct={newProduct}
                  updateNewProduct={updateNewProduct}
                  onSubmit={saveProduct}
                  productSaved={productSaved}
                  errorMessage={productSaveError}
                  onDismissError={() => setProductSaveError("")}
                  onCancel={() => setShowAddProduct(false)}
                  editMode={false}
                />
              </div>
            )}

            <div className="flex min-h-0 flex-1 gap-4 p-4">
              {/* Product search */}
              <ProductSearch
                search={search}
                setSearch={setSearch}
                filteredProducts={filteredProducts}
                addProduct={(product) => {
                  addProduct(product);
                  setSearch("");
                }}
              />

              {/* Current bill */}
              <section className="flex w-[560px] flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="border-b border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Current Bill</h3>
                      {billSaved && (
                        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                          Bill saved successfully.
                        </div>
                      )}
                      {billNotice && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                          {billNotice}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedCustomer?.name || "Walk-in Customer"}
                      </p>
                    </div>

                    <CustomerSelector
                      customer={selectedCustomer}
                      onChange={setSelectedCustomer}
                    />
                  </div>
                </div>

                <BillItems
                  billItems={billItems}
                  updatePrice={updatePrice}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />

                <BillSummary
                  totalMrp={totalMrp}
                  subtotal={subtotal}
                  productDiscount={productDiscount}
                  additionalDiscount={additionalDiscount}
                  setAdditionalDiscount={setAdditionalDiscount}
                  saveError={billSaveError}
                  onDismissSaveError={() => setBillSaveError("")}
                  hasItems={billItems.length > 0}
                  heldCount={heldBills.length}
                  onHoldBill={handleHoldBill}
                  onViewHeldBills={() => setShowHeldBillsModal(true)}
                  onSaveBill={async () => {
                    try {
                      const invoice = await saveBill(selectedCustomer);
                      await loadProducts();
                      setBillSaveError("");
                      setSavedInvoice(invoice);
                      setInvoicePreviewSource("billing");
                    } catch (error) {
                      console.error("Failed to save bill:", error);
                      setBillSaveError(error?.message || String(error));

                      setTimeout(() => {
                        setBillSaveError("");
                      }, 5000);
                    }
                  }}
                />
              </section>
            </div>
          </>
        )}
      </main>

      {/* Held Bills Modal */}
      <HeldBillsModal
        isOpen={showHeldBillsModal}
        onClose={() => setShowHeldBillsModal(false)}
        heldBills={heldBills}
        hasActiveBill={billItems.length > 0}
        onResume={handleResume}
        onResumeWithHold={handleResumeWithHold}
        onResumeWithDiscard={handleResumeWithDiscard}
        onDiscard={handleDiscardHeldBill}
        onClearAll={handleClearAllHeldBills}
      />
    </div>
  );
}

export default App;
