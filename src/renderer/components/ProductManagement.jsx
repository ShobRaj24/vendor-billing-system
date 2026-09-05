import AddProductForm from "./AddProductForm";
import { useState } from "react";

const emptyProduct = {
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
};

function ProductManagement({
  products,
  onDelete,
  onCreateProduct,
  onUpdateProduct,
  onAdjustStock,
  isInventoryEnabled = false,
}) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductDraft, setNewProductDraft] = useState(emptyProduct);
  const [productCreated, setProductCreated] = useState(false);
  const [newProductError, setNewProductError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductDraft, setEditProductDraft] = useState(emptyProduct);
  const [productUpdated, setProductUpdated] = useState(false);
  const [editProductError, setEditProductError] = useState("");

  // Stock Adjustment state
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustStockVal, setAdjustStockVal] = useState("");
  const [adjustingStock, setAdjustingStock] = useState(false);

  function updateNewProductDraft(field, value) {
    setNewProductError("");
    setNewProductDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveNewProduct() {
    if (!newProductDraft.name.trim()) {
      setNewProductError("Product name is required.");
      return;
    }

    if (
      newProductDraft.sellingPrice === "" ||
      Number(newProductDraft.sellingPrice) < 0
    ) {
      setNewProductError("Selling price is required.");
      return;
    }

    try {
      await onCreateProduct(newProductDraft);
      setShowAddProduct(false);
      setNewProductDraft(emptyProduct);
      setNewProductError("");
      setProductCreated(true);

      setTimeout(() => {
        setProductCreated(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to create product:", error);
      setNewProductError(error?.message || String(error));
    }
  }

  function startEditProduct(product) {
    setEditProductError("");
    setEditingProduct(product);
    setEditProductDraft({
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.category || "",
      unit: product.unit,
      mrp: product.mrp === null ? "" : String(product.mrp),
      sellingPrice: String(product.sellingPrice),
      stockQuantity: String(product.stockQuantity ?? 0),
      lowStockAlert: String(product.lowStockAlert ?? 5),
      trackStock: product.trackStock !== false,
    });
  }

  function updateEditProductDraft(field, value) {
    setEditProductError("");
    setEditProductDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProductUpdate() {
    if (!editingProduct) {
      return;
    }

    if (!editProductDraft.name.trim()) {
      setEditProductError("Product name is required.");
      return;
    }

    if (
      editProductDraft.sellingPrice === "" ||
      Number(editProductDraft.sellingPrice) < 0
    ) {
      setEditProductError("Selling price is required.");
      return;
    }

    try {
      await onUpdateProduct(editingProduct.id, editProductDraft);
      setEditingProduct(null);
      setEditProductDraft(emptyProduct);
      setEditProductError("");
      setProductUpdated(true);

      setTimeout(() => {
        setProductUpdated(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update product:", error);
      setEditProductError(error?.message || String(error));
    }
  }

  async function submitStockAdjustment(e) {
    if (e) e.preventDefault();
    if (!adjustingProduct) return;
    const qty = Number(adjustStockVal);
    if (!Number.isFinite(qty)) return;

    try {
      setAdjustingStock(true);
      await onAdjustStock(adjustingProduct.id, qty);
      setAdjustingProduct(null);
      setAdjustStockVal("");
    } catch (err) {
      alert("Failed to adjust stock: " + (err.message || err));
    } finally {
      setAdjustingStock(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isInventoryEnabled ? "Products & Inventory" : "Products Catalog"}
          </h2>
          <p className="text-xs text-slate-500">
            {isInventoryEnabled
              ? "Manage catalog pricing and stock levels"
              : "Manage store catalog and selling prices"}
          </p>
        </div>

        <button
          onClick={() => setShowAddProduct(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
        >
          + Add Product
        </button>
      </header>

      {showAddProduct && (
        <div className="px-6 pt-6">
          <AddProductForm
            newProduct={newProductDraft}
            updateNewProduct={updateNewProductDraft}
            onSubmit={saveNewProduct}
            productSaved={productCreated}
            errorMessage={newProductError}
            onDismissError={() => setNewProductError("")}
            onCancel={() => {
              setShowAddProduct(false);
              setNewProductError("");
            }}
            isInventoryEnabled={isInventoryEnabled}
          />
        </div>
      )}

      {editingProduct && (
        <div className="px-6 pt-6">
          <AddProductForm
            newProduct={editProductDraft}
            updateNewProduct={updateEditProductDraft}
            onSubmit={saveProductUpdate}
            productSaved={productUpdated}
            errorMessage={editProductError}
            onDismissError={() => setEditProductError("")}
            onCancel={() => {
              setEditingProduct(null);
              setEditProductDraft(emptyProduct);
              setEditProductError("");
            }}
            editMode={true}
            isInventoryEnabled={isInventoryEnabled}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                {isInventoryEnabled && (
                  <th className="px-4 py-3 text-center">Stock Level</th>
                )}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const isTracked = product.trackStock !== false;
                const stock = Number(product.stockQuantity || 0);
                const threshold = Number(product.lowStockAlert || 5);
                const isOutOfStock = isTracked && stock <= 0;
                const isLowStock = isTracked && stock > 0 && stock <= threshold;

                return (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {product.name}
                      {product.barcode && (
                        <span className="block font-mono text-[10px] text-slate-400">
                          {product.barcode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {product.category || "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-500">{product.unit}</td>

                    <td className="px-4 py-3 text-right text-slate-500">
                      {product.mrp === null
                        ? "—"
                        : `₹${Number(product.mrp).toFixed(2)}`}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{Number(product.sellingPrice).toFixed(2)}
                    </td>

                    {/* Stock status badge */}
                    {isInventoryEnabled && (
                      <td className="px-4 py-3 text-center">
                        {!isTracked ? (
                          <span className="text-slate-400">Untracked</span>
                        ) : isOutOfStock ? (
                          <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                            Out of stock ({stock})
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Low: {stock} {product.unit}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            {stock} {product.unit}
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-3 text-right">
                      {isInventoryEnabled && isTracked && (
                        <button
                          onClick={() => {
                            setAdjustingProduct(product);
                            setAdjustStockVal(String(stock));
                          }}
                          className="mr-2 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          📦 Stock
                        </button>
                      )}

                      <button
                        onClick={() => startEditProduct(product)}
                        className="mr-2 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-500">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* Stock Quick Adjustment Modal */}
      {adjustingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">
              Adjust Inventory Stock
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Update physical on-hand quantity for <strong className="text-slate-800">{adjustingProduct.name}</strong>.
            </p>

            <form onSubmit={submitStockAdjustment} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  New Stock Count ({adjustingProduct.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  value={adjustStockVal}
                  onChange={(e) => setAdjustStockVal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustingStock}
                  className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  {adjustingStock ? "Updating..." : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
