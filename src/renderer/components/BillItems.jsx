import { useState } from "react";

function BillItems({
  billItems,
  updatePrice,
  updateQuantity,
  removeItem,
  isInventoryEnabled = false,
  catalogProducts = [],
  onUpdateCatalogPrice,
}) {
  const [itemPendingRemoval, setItemPendingRemoval] = useState(null);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [priceDrafts, setPriceDrafts] = useState({});
  const [syncedIds, setSyncedIds] = useState({});
  const [syncingIds, setSyncingIds] = useState({});

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

    if (value !== "" && Number.isFinite(quantity) && quantity <= 0) {
      setItemPendingRemoval(item);
      return;
    }

    if (value !== "") {
      setItemPendingRemoval(null);
      updateQuantity(item.productId, value);
    }
  }

  function handleStepQuantity(item, delta) {
    const step = item.unit === "Piece" || item.unit === "Pack" ? 1 : 0.5;
    const currentQty = Number(quantityDrafts[item.productId] ?? item.quantity);
    const nextQty = +(currentQty + delta * step).toFixed(2);

    if (nextQty <= 0) {
      setItemPendingRemoval(item);
      return;
    }

    clearQuantityDraft(item.productId);
    updateQuantity(item.productId, nextQty);
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
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Removal Alert Confirmation */}
      {itemPendingRemoval && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-item-title"
          className="mx-3 mt-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 shadow-2xs"
        >
          <div className="min-w-0 flex-1">
            <p id="remove-item-title" className="font-semibold truncate">
              Remove &ldquo;{itemPendingRemoval.name}&rdquo;?
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => {
                clearQuantityDraft(itemPendingRemoval.productId);
                setItemPendingRemoval(null);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Keep
            </button>
            <button
              onClick={() => {
                removeItem(itemPendingRemoval.productId);
                clearQuantityDraft(itemPendingRemoval.productId);
                setItemPendingRemoval(null);
              }}
              className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {billItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
          <div className="mb-2 text-3xl text-slate-300">🛒</div>
          <p className="text-xs font-semibold text-slate-600">Current bill is empty</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Click products from catalog or scan barcode to add
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Compact Table Header */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex-1">Item</span>
            <span className="w-16 text-right">MRP</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-22 text-center">Qty</span>
            <span className="w-18 text-right">Total</span>
            <span className="w-6 text-center"></span>
          </div>

          {/* Scrollable Rows */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {billItems.map((item) => {
              const lineTotal = item.sellingPrice * item.quantity;
              const hasStockIssue =
                item.trackStock !== false &&
                item.stockQuantity !== undefined &&
                item.stockQuantity !== null;
              const exceedsStock = hasStockIssue && item.quantity > item.stockQuantity;
              const isOutOfStock = hasStockIssue && item.stockQuantity <= 0;

              const catalogProduct = catalogProducts?.find(
                (p) => p.id === item.productId,
              );
              const catalogMrp =
                catalogProduct?.mrp !== null &&
                catalogProduct?.mrp !== undefined &&
                catalogProduct?.mrp !== ""
                  ? Number(catalogProduct.mrp)
                  : null;
              const itemMrp =
                item.mrp !== null && item.mrp !== undefined && item.mrp !== ""
                  ? Number(item.mrp)
                  : null;
              const isMrpDifferent = catalogProduct && itemMrp !== catalogMrp;
              const isRateDifferent =
                catalogProduct &&
                Number(item.sellingPrice) !== Number(catalogProduct.sellingPrice);
              const hasCatalogDiff = isMrpDifferent || isRateDifferent;

              return (
                <div
                  key={item.productId}
                  className="group flex items-center px-3 py-2 transition-colors hover:bg-slate-50/60"
                >
                  {/* Item Description */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="truncate text-xs font-semibold text-slate-800"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {item.unit && (
                        <span className="shrink-0 rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-500">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {item.mrp !== null &&
                        Number(item.mrp) > Number(item.sellingPrice) && (
                          <span className="font-medium text-emerald-600">
                            ₹{(Number(item.mrp) - Number(item.sellingPrice)).toFixed(2)} off
                          </span>
                        )}

                      {item.mrp !== null &&
                        Number(item.mrp) > 0 &&
                        Number(item.sellingPrice) > Number(item.mrp) && (
                          <span
                            className="font-semibold text-amber-600"
                            title="Selling rate exceeds MRP"
                          >
                            ⚠️ Rate &gt; MRP
                          </span>
                        )}

                      {hasCatalogDiff && onUpdateCatalogPrice && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setSyncingIds((prev) => ({
                                ...prev,
                                [item.productId]: true,
                              }));
                              await onUpdateCatalogPrice(
                                item.productId,
                                item.mrp,
                                item.sellingPrice,
                              );
                              setSyncedIds((prev) => ({
                                ...prev,
                                [item.productId]: true,
                              }));
                              setTimeout(() => {
                                setSyncedIds((prev) => ({
                                  ...prev,
                                  [item.productId]: false,
                                }));
                              }, 2500);
                            } finally {
                              setSyncingIds((prev) => ({
                                ...prev,
                                [item.productId]: false,
                              }));
                            }
                          }}
                          disabled={syncingIds[item.productId]}
                          title="Save this edited MRP/Rate to the product catalog"
                          className="inline-flex items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[9px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          {syncedIds[item.productId] ? (
                            <span className="font-semibold text-emerald-700">
                              ✓ Saved to catalog
                            </span>
                          ) : syncingIds[item.productId] ? (
                            <span>Saving...</span>
                          ) : (
                            <span>🔄 Update catalog</span>
                          )}
                        </button>
                      )}

                      {isInventoryEnabled &&
                        (exceedsStock ? (
                          <span className="font-semibold text-amber-700">
                            ⚠️ Exceeds ({item.stockQuantity} avail)
                          </span>
                        ) : isOutOfStock ? (
                          <span className="font-semibold text-red-600">
                            ⚠️ Out of stock
                          </span>
                        ) : hasStockIssue ? (
                          <span className="text-slate-400">
                            Stock: {item.stockQuantity}
                          </span>
                        ) : null)}
                    </div>
                  </div>

                  {/* Inline Editable MRP */}
                  <div className="w-16 shrink-0 text-right">
                    <div className="inline-flex items-center justify-end">
                      <span className="mr-0.5 text-[10px] text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="—"
                        value={
                          priceDrafts[getPriceDraftKey(item.productId, "mrp")] ??
                          (item.mrp !== null && item.mrp !== undefined
                            ? item.mrp
                            : "")
                        }
                        onChange={(event) =>
                          handlePriceChange(item, "mrp", event.target.value)
                        }
                        onBlur={() => clearPriceDraft(item.productId, "mrp")}
                        title="Click to edit item MRP"
                        className="w-12 rounded border border-transparent bg-transparent py-0.5 text-right text-xs font-medium text-slate-500 hover:border-slate-300 focus:border-slate-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Inline Editable Selling Rate */}
                  <div className="w-16 shrink-0 text-right">
                    <div className="inline-flex items-center justify-end">
                      <span className="mr-0.5 text-[10px] text-slate-400">₹</span>
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
                        title="Click to edit selling rate"
                        className="w-12 rounded border border-transparent bg-transparent py-0.5 text-right text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-slate-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quantity Stepper [-] [ Qty ] [+] */}
                  <div className="w-22 shrink-0 px-0.5">
                    <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item, -1)}
                        title="Decrease quantity"
                        className="flex h-6 w-5 items-center justify-center rounded-l-md text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        step={
                          item.unit === "Piece" || item.unit === "Pack"
                            ? "1"
                            : "0.5"
                        }
                        value={quantityDrafts[item.productId] ?? item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(item, event.target.value)
                        }
                        onBlur={() => clearQuantityDraft(item.productId)}
                        className="h-6 w-9 border-x border-slate-200 bg-transparent text-center text-xs font-bold text-slate-800 focus:bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item, 1)}
                        title="Increase quantity"
                        className="flex h-6 w-5 items-center justify-center rounded-r-md text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="w-18 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-900">
                      ₹{lineTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <div className="w-6 shrink-0 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      title="Remove item"
                      className="rounded p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BillItems;
