function AddProductForm({
  newProduct,
  updateNewProduct,
  onSubmit,
  productSaved,
  errorMessage,
  onDismissError,
  onCancel,
  editMode = false,
}) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">
        {editMode ? "Edit Product" : "Add Product"}
      </h2>

      {productSaved && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Product saved successfully.
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{errorMessage}</span>
          <button
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="text-base leading-none text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          value={newProduct.name}
          onChange={(e) => updateNewProduct("name", e.target.value)}
          placeholder="Product name *"
          className="rounded-lg border px-3 py-2"
        />

        <input
          value={newProduct.sku}
          onChange={(e) => updateNewProduct("sku", e.target.value)}
          placeholder="SKU"
          className="rounded-lg border px-3 py-2"
        />

        <input
          value={newProduct.barcode}
          onChange={(e) => updateNewProduct("barcode", e.target.value)}
          placeholder="Barcode"
          className="rounded-lg border px-3 py-2"
        />

        <input
          value={newProduct.category}
          onChange={(e) => updateNewProduct("category", e.target.value)}
          placeholder="Category"
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={newProduct.unit}
          onChange={(e) => updateNewProduct("unit", e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="Piece">Piece</option>
          <option value="Kg">Kg</option>
          <option value="Gram">Gram</option>
          <option value="Litre">Litre</option>
          <option value="Pack">Pack</option>
        </select>

        <input
          type="number"
          min="0"
          step="0.01"
          value={newProduct.mrp}
          onChange={(e) => updateNewProduct("mrp", e.target.value)}
          placeholder="MRP (optional)"
          className="rounded-lg border px-3 py-2"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={newProduct.sellingPrice}
          onChange={(e) => updateNewProduct("sellingPrice", e.target.value)}
          placeholder="Selling price *"
          className="rounded-lg border px-3 py-2"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onSubmit}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {editMode ? "Update Product" : "Save Product"}
        </button>

        <button
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddProductForm;
