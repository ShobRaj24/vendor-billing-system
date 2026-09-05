import { useState } from "react";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function HeldBillsModal({
  isOpen,
  onClose,
  heldBills,
  hasActiveBill = false,
  onResume,
  onResumeWithHold,
  onResumeWithDiscard,
  onDiscard,
  onClearAll,
}) {
  const [billPendingResume, setBillPendingResume] = useState(null);

  if (!isOpen) return null;

  function handleResumeClick(bill) {
    if (hasActiveBill) {
      setBillPendingResume(bill);
    } else {
      onResume(bill);
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      >
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Held Bills ({heldBills.length})
              </h3>
              <p className="text-xs text-slate-500">
                Parked bills can be resumed anytime to complete checkout.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {heldBills.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm("Discard all held bills?")) {
                      onClearAll();
                    }
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {heldBills.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">No bills on hold</p>
                <p className="mt-1 text-xs text-slate-400">
                  When you click "Hold Bill" during checkout, it will be saved here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {heldBills.map((bill, index) => {
                  const itemCount = bill.items.reduce(
                    (total, item) => total + Number(item.quantity || 1),
                    0,
                  );
                  return (
                    <div
                      key={bill.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            #{index + 1}
                          </span>
                          <h4 className="font-semibold text-slate-900">
                            {bill.customer?.name || "Walk-in Customer"}
                          </h4>
                          <span className="text-xs text-slate-400">
                            • {timeAgo(bill.heldAt)} ({formatTime(bill.heldAt)})
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                          <span>
                            {bill.items.length} product{bill.items.length === 1 ? "" : "s"} ({itemCount} {itemCount === 1 ? "unit" : "units"})
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-xs text-slate-600">
                            {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                        <span className="text-base font-bold text-slate-900">
                          ₹{bill.finalAmount.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm("Discard this held bill?")) {
                                onDiscard(bill.id);
                              }
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Discard
                          </button>
                          <button
                            onClick={() => handleResumeClick(bill)}
                            className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                          >
                            Resume Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Explicit Conflict Dialog */}
      {billPendingResume && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-700">
              ⚠️
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Active Items on Screen
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You currently have active products in your cart. How would you like to handle your current bill before resuming{" "}
              <strong className="text-slate-900">
                {billPendingResume.customer?.name || "Walk-in Customer"}'s bill
              </strong>?
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const bill = billPendingResume;
                  setBillPendingResume(null);
                  onResumeWithHold(bill);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <span>📥 Hold Current Bill & Resume</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const bill = billPendingResume;
                  setBillPendingResume(null);
                  onResumeWithDiscard(bill);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <span>🗑️ Discard Current Bill & Resume</span>
              </button>

              <button
                type="button"
                onClick={() => setBillPendingResume(null)}
                className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel (Keep Current Bill)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HeldBillsModal;
