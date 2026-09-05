import { useState } from "react";

function BillItems({ billItems, updatePrice, updateQuantity, removeItem }) {
  const [itemPendingRemoval, setItemPendingRemoval] = useState(null);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [priceDrafts, setPriceDrafts] = useState({});

  function clearQuantityDraft(productId) {
    setQuantityDrafts((current) => {
      const { [productId]: _draft, ...remainingDrafts } = current;
      return remainingDrafts;
    });
  }

  function handleQuantityChange(item, value) {
    const quantity = Number(value);

    setQuantityDrafts((current) => ({
      ...current,
      [item.productId]: value,
    }));

    if (value !== "" && Number.isFinite(quantity) && quantity === 0) {
      setItemPendingRemoval(item);
      return;
    }

    if (value !== "") {
      setItemPendingRemoval(null);
      updateQuantity(item.productId, value);
    }
  }

  function getPriceDraftKey(productId, field) {
    return `${productId}:${field}`;
  }

  function clearPriceDraft(productId, field) {
    const draftKey = getPriceDraftKey(productId, field);

    setPriceDrafts((current) => {
      const { [draftKey]: _draft, ...remainingDrafts } = current;
      return remainingDrafts;
    });
  }

  function handlePriceChange(item, field, value) {
    const numericValue = Number(value);
    const draftKey = getPriceDraftKey(item.productId, field);

    setPriceDrafts((current) => ({
      ...current,
      [draftKey]: value,
    }));

    if (field === "mrp" && value === "") {
      updatePrice(item.productId, field, null);
      return;
    }

    if (value !== "" && Number.isFinite(numericValue) && numericValue >= 0) {
      updatePrice(item.productId, field, value);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {itemPendingRemoval && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-item-title"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p id="remove-item-title" className="font-medium">
            Remove {itemPendingRemoval.name} from this bill?
          </p>
          <p className="mt-1 text-amber-800">
            Keep it if you want to enter a different quantity.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                clearQuantityDraft(itemPendingRemoval.productId);
                setItemPendingRemoval(null);
              }}
              className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium hover:bg-amber-100"
            >
              Keep Product
            </button>
            <button
              onClick={() => {
                removeItem(itemPendingRemoval.productId);
                clearQuantityDraft(itemPendingRemoval.productId);
                setItemPendingRemoval(null);
              }}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Remove Product
            </button>
          </div>
        </div>
      )}

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
                  {item.trackStock !== false &&
                    item.stockQuantity !== undefined &&
                    item.stockQuantity !== null && (
                      <p className="mt-0.5 text-[10px]">
                        {item.quantity > item.stockQuantity ? (
                          <span className="font-semibold text-amber-700">
                            ⚠️ Exceeds stock ({item.stockQuantity} {item.unit} available)
                          </span>
                        ) : item.stockQuantity <= 0 ? (
                          <span className="font-semibold text-red-600">
                            ⚠️ Out of stock (0)
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Stock: {item.stockQuantity} {item.unit}
                          </span>
                        )}
                      </p>
                    )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        MRP
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          priceDrafts[getPriceDraftKey(item.productId, "mrp")] ??
                          item.mrp ??
                          ""
                        }
                        onChange={(event) =>
                          handlePriceChange(item, "mrp", event.target.value)
                        }
                        onBlur={() => clearPriceDraft(item.productId, "mrp")}
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
                        value={
                          priceDrafts[
                            getPriceDraftKey(item.productId, "sellingPrice")
                          ] ?? item.sellingPrice
                        }
                        onChange={(event) =>
                          handlePriceChange(
                            item,
                            "sellingPrice",
                            event.target.value,
                          )
                        }
                        onBlur={() =>
                          clearPriceDraft(item.productId, "sellingPrice")
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
                  value={quantityDrafts[item.productId] ?? item.quantity}
                  onChange={(event) => handleQuantityChange(item, event.target.value)}
                  onBlur={() => clearQuantityDraft(item.productId)}
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
