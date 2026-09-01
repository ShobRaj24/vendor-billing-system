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
    billSaved,
  } = useBilling();
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [billSaveError, setBillSaveError] = useState("");
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
  });
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [invoicePreviewSource, setInvoicePreviewSource] = useState(null);
  const [currentPage, setCurrentPage] = useState("billing");

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
    });

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
      ),
    );
  }
  useEffect(() => {
    async function loadProducts() {
      try {
        const result = await window.api.products.list();
        setProducts(result);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }

    loadProducts();
  }, []);
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
          <h1 className="text-xl font-bold">Vendor Billing</h1>
          <p className="mt-1 text-xs text-slate-500">Billing System</p>
        </div>

        <nav className="flex-1 p-3">
          <button
            onClick={() => setCurrentPage("billing")}
            className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "billing"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            New Bill
          </button>
          <button
            onClick={() => setCurrentPage("products")}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "products"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setCurrentPage("invoices")}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "invoices"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setCurrentPage("reports")}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
              currentPage === "reports"
                ? "bg-slate-900 font-medium text-white"
                : "hover:bg-slate-100"
            }`}
          >
            Reports
          </button>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button className="w-full rounded-lg px-4 py-3 text-left text-sm hover:bg-slate-100">
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {savedInvoice ? (
          <InvoicePreview
            invoice={savedInvoice}
            onBack={() => {
              setSavedInvoice(null);
              setInvoicePreviewSource(null);

              if (invoicePreviewSource === "history") {
                setCurrentPage("invoices");
              }
            }}
          />
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
            onDelete={deleteProduct}
          />
        ) : (
          <>
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
              <div>
                <h2 className="text-lg font-semibold">New Bill</h2>
                <p className="text-xs text-slate-500">
                  Start billing immediately
                </p>
              </div>

              <div className="text-sm text-slate-500">Bill # — New</div>
            </header>
            <button
              onClick={() => setShowAddProduct(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              + Add Product
            </button>
            {showAddProduct && (
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

              <section className="flex w-[560px] flex-col rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Current Bill</h3>
                      {billSaved && (
                        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                          Bill saved successfully.
                        </div>
                      )}
                      <p className="text-xs text-slate-500">Walk-in Customer</p>
                    </div>

                    <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                      Change
                    </button>
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
                  onSaveBill={async () => {
                    try {
                      const invoice = await saveBill();
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
    </div>
  );
}

export default App;
