import { useEffect, useState } from "react";

function DashboardPage({
  onNavigate,
  onOpenInvoice,
  onInwardProduct,
  isInventoryEnabled = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const result = await window.api.dashboard.summary();
        setData(result);
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-xs text-slate-500">
        Loading dashboard metrics...
      </div>
    );
  }

  const todaySales = data?.todaySales || 0;
  const todayInvoiceCount = data?.todayInvoiceCount || 0;
  const totalProducts = data?.totalProducts || 0;
  const lowStockCount = data?.totalLowStockCount || 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        <p className="text-xs text-slate-500">
          {isInventoryEnabled
            ? "Store overview, today's sales performance, and inventory alerts"
            : "Store overview and today's sales performance"}
        </p>
      </header>

      <div className="space-y-6 p-6">
        {/* Quick Action Shortcuts */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => onNavigate("billing")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-lg text-white">
              🧾
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">New Bill</h4>
              <p className="text-[10px] text-slate-500">Start POS checkout</p>
            </div>
          </button>

          {isInventoryEnabled ? (
            <button
              onClick={() => onNavigate("purchases")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg text-white">
                🛒
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Inward Stock</h4>
                <p className="text-[10px] text-slate-500">Add purchase bill</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onNavigate("invoices")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg text-white">
                📚
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Invoices</h4>
                <p className="text-[10px] text-slate-500">View bill history</p>
              </div>
            </button>
          )}

          <button
            onClick={() => onNavigate("products")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white">
              📦
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Products</h4>
              <p className="text-[10px] text-slate-500">
                {data?.totalProducts || 0} active items
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("reports")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-lg text-white">
              📊
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Reports</h4>
              <p className="text-[10px] text-slate-500">Sales & exports</p>
            </div>
          </button>
        </section>

        {/* Today's KPI Cards */}
        <section
          className={`grid gap-4 ${
            isInventoryEnabled
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-3"
          }`}
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs border-l-4 border-l-slate-900">
            <p className="text-xs font-medium text-slate-500">Today's Total Sales</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              ₹{todaySales.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Net revenue today</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs border-l-4 border-l-blue-600">
            <p className="text-xs font-medium text-slate-500">Today's Invoices</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {todayInvoiceCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Completed checkout bills</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs border-l-4 border-l-emerald-600">
            <p className="text-xs font-medium text-slate-500">Total Catalog Products</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {totalProducts}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Active items in store</p>
          </div>

          {isInventoryEnabled && (
            <div
              className={`rounded-xl border bg-white p-5 shadow-xs border-l-4 ${
                lowStockCount > 0
                  ? "border-l-red-500 border-red-200"
                  : "border-l-slate-300 border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">Low Stock Alert</p>
              <p
                className={`mt-1.5 text-2xl font-bold ${
                  lowStockCount > 0 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {lowStockCount} items
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Urgent reorder needed</p>
            </div>
          )}
        </section>

        {/* Low Stock & Recent Invoices Grid */}
        <section
          className={`grid gap-6 ${
            isInventoryEnabled ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Low Stock Alerts */}
          {isInventoryEnabled && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <h3 className="font-semibold text-sm text-slate-900">
                    Low Stock Warnings
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate("products")}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  View all →
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100 text-xs">
                {data?.lowStockProducts?.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    ✓ All products have healthy inventory levels.
                  </div>
                ) : (
                  data?.lowStockProducts?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.category || "General"} • Alert at {item.lowStockAlert} {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.stockQuantity <= 0
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.stockQuantity <= 0
                            ? "Out of stock"
                            : `${item.stockQuantity} ${item.unit} left`}
                        </span>

                        <button
                          onClick={() => {
                            if (onInwardProduct) {
                              onInwardProduct(item);
                            } else {
                              onNavigate("purchases");
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          + Inward
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🕒</span>
                <h3 className="font-semibold text-sm text-slate-900">
                  Recent Bills
                </h3>
              </div>
              <button
                onClick={() => onNavigate("invoices")}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                All invoices →
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 text-xs">
              {data?.recentInvoices?.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No invoices created yet.
                </div>
              ) : (
                data?.recentInvoices?.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onOpenInvoice && onOpenInvoice(inv)}
                    className="flex cursor-pointer items-center justify-between py-2.5 hover:bg-slate-50/80 rounded-lg px-2 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900">
                        {inv.customerName || "Walk-in Customer"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono text-slate-700 font-medium">
                          {inv.invoiceNumber}
                        </span>
                        {" • "}
                        {new Date(inv.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span className="font-bold text-sm text-slate-900">
                      ₹{inv.finalAmount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
