function BillItems({ billItems, updatePrice, updateQuantity, removeItem }) {
  return (
    <div className="flex-1 overflow-auto p-4">
      {billItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No products added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {billItems.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        MRP
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.mrp ?? ""}
                        onChange={(event) =>
                          updatePrice(item.productId, "mrp", event.target.value)
                        }
                        placeholder="Optional"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        SP
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.sellingPrice}
                        onChange={(event) =>
                          updatePrice(
                            item.productId,
                            "sellingPrice",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <input
                  type="number"
                  min="0"
                  step={
                    item.unit === "Piece" || item.unit === "Pack" ? "1" : "0.5"
                  }
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.productId, event.target.value)
                  }
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                />

                <p className="font-semibold">
                  ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BillItems;
