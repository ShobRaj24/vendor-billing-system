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
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        {editMode ? "Edit Product" : "Add Product"}
      </h2>

      {productSaved && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          Product saved successfully.
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
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

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="mb-1 block font-medium text-slate-700">Product Name *</label>
          <input
            value={newProduct.name}
            onChange={(e) => updateNewProduct("name", e.target.value)}
            placeholder="Product name *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">SKU</label>
          <input
            value={newProduct.sku || ""}
            onChange={(e) => updateNewProduct("sku", e.target.value)}
            placeholder="SKU"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Barcode</label>
          <input
            value={newProduct.barcode || ""}
            onChange={(e) => updateNewProduct("barcode", e.target.value)}
            placeholder="Barcode"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Category</label>
          <input
            value={newProduct.category || ""}
            onChange={(e) => updateNewProduct("category", e.target.value)}
            placeholder="Category"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Unit</label>
          <select
            value={newProduct.unit || "Piece"}
            onChange={(e) => updateNewProduct("unit", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 bg-white"
          >
            <option value="Piece">Piece</option>
            <option value="Kg">Kg</option>
            <option value="Gram">Gram</option>
            <option value="Litre">Litre</option>
            <option value="Pack">Pack</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">MRP (Optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newProduct.mrp ?? ""}
            onChange={(e) => updateNewProduct("mrp", e.target.value)}
            placeholder="MRP"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Selling Price *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newProduct.sellingPrice ?? ""}
            onChange={(e) => updateNewProduct("sellingPrice", e.target.value)}
            placeholder="Selling price *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        {/* Stock tracking fields */}
        <div>
          <label className="mb-1 block font-medium text-slate-700">Current Stock</label>
          <input
            type="number"
            step="any"
            value={newProduct.stockQuantity ?? 0}
            onChange={(e) => updateNewProduct("stockQuantity", e.target.value)}
            placeholder="Current Stock Quantity"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Low Stock Alert Level</label>
          <input
            type="number"
            step="any"
            value={newProduct.lowStockAlert ?? 5}
            onChange={(e) => updateNewProduct("lowStockAlert", e.target.value)}
            placeholder="Alert when stock falls below"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="trackStockCheckbox"
            checked={newProduct.trackStock !== false}
            onChange={(e) => updateNewProduct("trackStock", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <label htmlFor="trackStockCheckbox" className="font-medium text-slate-700 cursor-pointer">
            Track inventory for this product
          </label>
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onSubmit}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
        >
          {editMode ? "Update Product" : "Save Product"}
        </button>

        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddProductForm;
