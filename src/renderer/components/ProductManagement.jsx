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
};

function ProductManagement({
  products,
  onDelete,
  onCreateProduct,
  onUpdateProduct,
}) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductDraft, setNewProductDraft] = useState(emptyProduct);
  const [productCreated, setProductCreated] = useState(false);
  const [newProductError, setNewProductError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductDraft, setEditProductDraft] = useState(emptyProduct);
  const [productUpdated, setProductUpdated] = useState(false);
  const [editProductError, setEditProductError] = useState("");

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
      setNewProductDraft(emptyProduct);
      setNewProductError("");
      setProductCreated(true);

      setTimeout(() => {
        setProductCreated(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save product:", error);
      setNewProductError(error?.message || String(error));
    }
  }

  function startEditProduct(product) {
    setShowAddProduct(false);
    setEditProductError("");
    setEditingProduct(product);
    setEditProductDraft({
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.category || "",
      unit: product.unit || "Piece",
      mrp: product.mrp == null ? "" : String(product.mrp),
      sellingPrice:
        product.sellingPrice == null ? "" : String(product.sellingPrice),
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-xs text-slate-500">Manage your products</p>
        </div>

        <button
          onClick={() => setShowAddProduct(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
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
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {product.category || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-500">{product.unit}</td>

                  <td className="px-4 py-3 text-right">
                    {product.mrp === null
                      ? "—"
                      : `₹${Number(product.mrp).toFixed(2)}`}
                  </td>

                  <td className="px-4 py-3 text-right font-medium">
                    ₹{Number(product.sellingPrice).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEditProduct(product)}
                      className="mr-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(product)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No products found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductManagement;
