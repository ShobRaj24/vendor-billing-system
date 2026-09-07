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
import OnboardingModal from "./components/OnboardingModal";
import {
  IconDashboard,
  IconReceipt,
  IconPackage,
  IconPurchases,
  IconInvoices,
  IconReports,
  IconCustomers,
  IconSettings,
  IconStore,
} from "./components/Icons";

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
  const [inwardInitialProduct, setInwardInitialProduct] = useState(null);

  // Settings state
  const [settings, setSettings] = useState(null);
  const isInventoryEnabled = Boolean(settings?.enableInventory);

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

  async function handleSelectOnboardingMode(mode) {
    const isFull = mode === "full";
    const updated = {
      ...(settings || {}),
      enableInventory: isFull,
      setupCompleted: true,
    };
    try {
      const saved = await window.api.settings.save(updated);
      setSettings(saved);
    } catch (err) {
      console.error("Failed to save onboarding mode:", err);
    }
  }

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

  async function handleUpdateProductCatalogPrice(productId, newMrp, newSellingPrice) {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;
    try {
      const updatedProduct = await window.api.products.update({
        ...existing,
        mrp: newMrp === "" || newMrp === null ? null : Number(newMrp),
        sellingPrice: Number(newSellingPrice ?? existing.sellingPrice),
      });
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
        ),
      );
    } catch (error) {
      console.error("Failed to update product catalog price:", error);
    }
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
      product.name?.toLowerCase().includes(value) ||
      (product.barcode && product.barcode.toLowerCase().includes(value)) ||
      (product.sku && product.sku.toLowerCase().includes(value)) ||
      (product.category && product.category.toLowerCase().includes(value)),
    );
  }, [search, products]);

  const totalItemsCount = useMemo(
    () =>
      billItems.reduce(
        (acc, item) => acc + (Number(item.quantity) || 0),
        0,
      ),
    [billItems],
  );

  function handleClearBill() {
    if (billItems.length === 0) return;
    if (window.confirm("Are you sure you want to clear the current bill?")) {
      resetBill();
      setSelectedCustomer(null);
    }
  }

  async function handleSaveCurrentBill() {
    if (billItems.length === 0) return;
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
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (
        currentPage !== "billing" ||
        savedInvoice ||
        showHeldBillsModal ||
        showAddProduct ||
        showOnboarding
      ) {
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = document.getElementById("product-search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        if (billItems.length > 0) {
          handleHoldBill();
        }
      } else if (e.key === "F8" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        if (billItems.length > 0) {
          handleSaveCurrentBill();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentPage,
    savedInvoice,
    showHeldBillsModal,
    showAddProduct,
    showOnboarding,
    billItems,
    selectedCustomer,
    additionalDiscount,
    subtotal,
  ]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      {/* Sleek Modern Dark Slate Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-800 bg-[#090D16] text-slate-300 select-none">
        {/* Store Brand Header */}
        <div className="border-b border-slate-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-950/60">
              <IconStore className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-white tracking-tight">
                {settings?.storeName || "Vendor Billing"}
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>POS Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>

          {[
            { id: "dashboard", label: "Dashboard", icon: IconDashboard },
            { id: "billing", label: "New Bill", icon: IconReceipt, badge: "POS" },
            {
              id: "products",
              label: isInventoryEnabled ? "Products & Stock" : "Products",
              icon: IconPackage,
            },
            ...(isInventoryEnabled
              ? [{ id: "purchases", label: "Purchases", icon: IconPurchases }]
              : []),
            { id: "invoices", label: "Invoices", icon: IconInvoices },
            { id: "reports", label: "Reports", icon: IconReports },
            { id: "customers", label: "Customers", icon: IconCustomers },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-transform duration-150 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:scale-110 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      isActive
                        ? "bg-indigo-700/80 text-indigo-100"
                        : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Settings */}
        <div className="border-t border-slate-800/80 p-3 space-y-2">
          <button
            onClick={() => setCurrentPage("settings")}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
              currentPage === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
            }`}
          >
            <IconSettings className="h-4 w-4" />
            <span>Settings</span>
          </button>

          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="font-medium text-slate-400">Register #01</span>
            <span className="text-emerald-400 font-mono text-[9px] font-bold">ONLINE</span>
          </div>
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
            isInventoryEnabled={isInventoryEnabled}
            onNavigate={(page) => setCurrentPage(page)}
            onInwardProduct={(product) => {
              setInwardInitialProduct(product);
              setCurrentPage("purchases");
            }}
            onOpenInvoice={(invoice) => {
              setSavedInvoice(invoice);
              setInvoicePreviewSource("dashboard");
            }}
          />
        ) : currentPage === "purchases" && isInventoryEnabled ? (
          <PurchasesPage
            products={products}
            onProductStockUpdated={loadProducts}
            initialProduct={inwardInitialProduct}
            onClearInitialProduct={() => setInwardInitialProduct(null)}
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
            isInventoryEnabled={isInventoryEnabled}
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
                  isInventoryEnabled={isInventoryEnabled}
                />
              </div>
            )}

            <div className="flex min-h-0 flex-1 gap-4 p-4">
              {/* Product search */}
              <ProductSearch
                search={search}
                setSearch={setSearch}
                products={products}
                filteredProducts={filteredProducts}
                isInventoryEnabled={isInventoryEnabled}
                addProduct={(product) => {
                  addProduct(product);
                  setSearch("");
                }}
              />

              {/* Current bill */}
              <section className="flex w-[420px] md:w-[440px] lg:w-[480px] xl:w-[500px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">Current Bill</h3>
                        {billItems.length > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {billItems.length} item{billItems.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {billSaved && (
                        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          Bill saved successfully.
                        </div>
                      )}
                      {billNotice && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {billNotice}
                        </div>
                      )}
                      <p className="mt-0.5 text-[11px] text-slate-400">
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
                  isInventoryEnabled={isInventoryEnabled}
                  catalogProducts={products}
                  onUpdateCatalogPrice={handleUpdateProductCatalogPrice}
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
                  totalItemsCount={totalItemsCount}
                  heldCount={heldBills.length}
                  onHoldBill={handleHoldBill}
                  onClearBill={handleClearBill}
                  onViewHeldBills={() => setShowHeldBillsModal(true)}
                  onSaveBill={handleSaveCurrentBill}
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

      {/* First-Time Welcome & Mode Selection Modal */}
      <OnboardingModal
        isOpen={settings !== null && settings.setupCompleted !== true}
        onSelectMode={handleSelectOnboardingMode}
      />
    </div>
  );
}

export default App;
