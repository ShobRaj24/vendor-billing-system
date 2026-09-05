import { useState } from "react";

function SalesReturnsModal({ invoice, isOpen, onClose, onReturnSuccess }) {
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState("Customer return");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedReturn, setCompletedReturn] = useState(null);

  if (!isOpen || !invoice) return null;

  function handleQtyChange(productId, val, maxQty) {
    const qty = Number(val);
    if (val === "" || (Number.isFinite(qty) && qty >= 0 && qty <= maxQty)) {
      setReturnQtys((current) => ({
        ...current,
        [productId]: val,
      }));
    }
  }

  // Calculate return items and refund total
  const selectedItems = invoice.items
    .map((item) => {
      const qty = Number(returnQtys[item.productId] || 0);
      return {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: qty,
        refundPrice: item.sellingPrice,
        lineTotal: qty * item.sellingPrice,
      };
    })
    .filter((item) => item.quantity > 0);

  const totalRefund = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  async function handleSubmitReturn(e) {
    if (e) e.preventDefault();
    if (selectedItems.length === 0) {
      setError("Specify a return quantity for at least one item.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const result = await window.api.returns.create({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName || "Walk-in Customer",
        reason: reason.trim() || null,
        items: selectedItems,
      });

      setCompletedReturn(result);
      if (onReturnSuccess) {
        onReturnSuccess(result);
      }
    } catch (err) {
      console.error("Failed to process return:", err);
      setError(err.message || "Failed to process return.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {completedReturn ? "Return Credit Note" : `Sales Return — ${invoice.invoiceNumber}`}
            </h3>
            <p className="text-xs text-slate-500">
              Customer: {invoice.customerName || "Walk-in Customer"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {completedReturn ? (
            /* Completed Return Voucher / Slip */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <span className="text-2xl">✓</span>
                <h4 className="mt-1 text-sm font-bold text-emerald-900">
                  Return Processed Successfully
                </h4>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Items have been restocked back into your inventory.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Voucher #:</span>
                  <span className="font-semibold text-slate-900">{completedReturn.returnNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Invoice:</span>
                  <span className="font-semibold text-slate-900">{completedReturn.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reason:</span>
                  <span>{completedReturn.reason || "Customer return"}</span>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2 text-left">Item Restocked</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Refund Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedReturn.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2 font-medium text-slate-900">{item.productName}</td>
                      <td className="py-2 text-right font-semibold text-emerald-700">+{item.quantity}</td>
                      <td className="py-2 text-right text-slate-600">₹{item.refundPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold text-slate-900">₹{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
                <span>Total Refund Amount:</span>
                <span className="text-base text-red-600">₹{completedReturn.refundAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            /* Return Selection Form */
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Enter the quantity being returned for each item. Returned items will be restored to your inventory.
              </p>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Sold Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {item.productName}
                          <span className="block text-[10px] text-slate-400">{item.unit}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-slate-600">₹{item.sellingPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            step="any"
                            value={returnQtys[item.productId] ?? ""}
                            onChange={(e) =>
                              handleQtyChange(item.productId, e.target.value, item.quantity)
                            }
                            placeholder="0"
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs outline-none focus:border-slate-500 font-semibold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Reason for Return
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Defective, Wrong Item, Customer Changed Mind"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Calculated Refund:</span>
                <span className="text-base font-bold text-red-600">₹{totalRefund.toFixed(2)}</span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end gap-2">
          {completedReturn ? (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || selectedItems.length === 0}
                onClick={handleSubmitReturn}
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Process Return & Restock"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesReturnsModal;
