function BillSummary({
  totalMrp,
  subtotal,
  productDiscount,
  additionalDiscount,
  setAdditionalDiscount,
  saveError,
  onDismissSaveError,
  onSaveBill,
}) {
  const finalAmount = subtotal - Number(additionalDiscount || 0);

  return (
    <div className="border-t border-slate-200 p-4">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Total MRP</span>
          <span>₹{totalMrp.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Product Discount</span>
          <span>₹{productDiscount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Additional Discount</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={additionalDiscount}
            onChange={(event) => setAdditionalDiscount(event.target.value)}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-right"
          />
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
          <span>Final Amount</span>
          <span>₹{finalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-lg border border-slate-300 px-4 py-3 font-medium">
          Hold Bill
        </button>

        <button
          onClick={onSaveBill}
          className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800"
        >
          Save Bill
        </button>
      </div>

      {saveError && (
        <div
          role="alert"
          className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{saveError}</span>
          <button
            onClick={onDismissSaveError}
            aria-label="Dismiss error"
            className="text-base leading-none text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default BillSummary;
