function OnboardingModal({ isOpen, onSelectMode }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-8 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-md">
            🏪
          </div>
          <h2
            id="onboarding-title"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Welcome to Vendor Billing!
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose how you would like to run your POS system. You can change this
            anytime in <strong>Settings</strong>.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {/* Option 1: Quick Billing */}
          <button
            type="button"
            onClick={() => onSelectMode("quick")}
            className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-slate-900 hover:shadow-lg focus:border-slate-900 focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  🧾
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Default / Simple
                </span>
              </div>

              <h3 className="mt-4 font-bold text-sm text-slate-900">
                Quick Billing & POS
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Streamlined checkout with fast catalog lookup, customer directory,
                and instant thermal receipt printing.
              </p>

              <ul className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> No inventory counts or out-of-stock blocks
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Fast product adding (no stock fields)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Clean, distraction-free cashier screen
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <span className="block w-full rounded-xl bg-slate-900 py-2.5 text-center text-xs font-bold text-white shadow-xs group-hover:bg-slate-800 transition-colors">
                Start with Quick Billing →
              </span>
            </div>
          </button>

          {/* Option 2: Full Retail & Inventory */}
          <button
            type="button"
            onClick={() => onSelectMode("full")}
            className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-blue-600 hover:shadow-lg focus:border-blue-600 focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  📦
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Full Operations
                </span>
              </div>

              <h3 className="mt-4 font-bold text-sm text-slate-900">
                Full Retail & Inventory
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Complete store operations with live warehouse inventory, low-stock
                alerts, and supplier inward purchase bills.
              </p>

              <ul className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-blue-500 font-bold">✓</span> Live stock tracking & auto-deduction
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-blue-500 font-bold">✓</span> Supplier directory & inward purchases
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-blue-500 font-bold">✓</span> Low-stock alerts & stock adjustments
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <span className="block w-full rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                Start with Full Retail →
              </span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-center text-[11px] text-slate-400">
          💡 You can toggle or customize these modules anytime in{" "}
          <strong className="text-slate-600">Settings → Add-ons & Optional Modules</strong>.
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
