function BillSummary({
  totalMrp,
  subtotal,
  productDiscount,
  additionalDiscount,
  setAdditionalDiscount,
  saveError,
  onDismissSaveError,
  onSaveBill,
  onHoldBill,
  onClearBill,
  heldCount = 0,
  onViewHeldBills,
  hasItems = false,
  totalItemsCount = 0,
}) {
  const finalAmount = Math.max(0, subtotal - Number(additionalDiscount || 0));

  return (
    <div className="border-t border-slate-200 bg-white p-3.5 space-y-3">
      {/* Subtotal & Discount Breakdown */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Items Total</span>
          <span className="font-medium text-slate-700">₹{subtotal.toFixed(2)}</span>
        </div>

        {totalMrp > subtotal && (
          <div className="flex justify-between text-slate-500">
            <span>Product Savings</span>
            <span className="font-medium text-emerald-600">
              - ₹{productDiscount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-slate-500">Extra Discount</span>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-[11px] text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={additionalDiscount}
              onChange={(event) => setAdditionalDiscount(event.target.value)}
              className="w-24 rounded-lg border border-slate-300 py-1 pl-5 pr-2 text-right text-xs font-semibold text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* High-Impact Total Payable Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-sm border border-slate-800/60">
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Payable
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              {totalItemsCount} {totalItemsCount === 1 ? "unit" : "units"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black tracking-tight text-emerald-400 drop-shadow-xs">
              ₹{finalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onHoldBill}
          disabled={!hasItems}
          title="Place this bill on hold (F4)"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>⏸ Hold</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
            F4
          </span>
        </button>

        <button
          type="button"
          onClick={onSaveBill}
          disabled={!hasItems}
          title="Save and process invoice (F8 or Ctrl+Enter)"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition-all hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-emerald-500"
        >
          <span>💾 Save Bill</span>
          <span className="rounded bg-emerald-700/80 px-1.5 py-0.5 text-[9px] font-mono text-emerald-100">
            F8
          </span>
        </button>
      </div>

      {/* Secondary Helper Row: Clear Bill & Held Bills Indicator */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {hasItems ? (
          <button
            type="button"
            onClick={onClearBill}
            className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors"
          >
            Clear current bill
          </button>
        ) : (
          <span />
        )}

        {heldCount > 0 && (
          <button
            type="button"
            onClick={onViewHeldBills}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors"
          >
            <span>⏸ {heldCount} on hold</span>
            <span>→</span>
          </button>
        )}
      </div>

      {saveError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
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
