import { useEffect, useState } from "react";
import {
  IconDashboard,
  IconReceipt,
  IconPurchases,
  IconInvoices,
  IconPackage,
  IconReports,
} from "./Icons";

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
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-950/20 transition-transform duration-150 group-hover:scale-105">
              <IconReceipt className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                New Bill
              </h4>
              <p className="text-[10px] font-medium text-slate-400">Start POS checkout</p>
            </div>
          </button>

          {isInventoryEnabled ? (
            <button
              onClick={() => onNavigate("purchases")}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-950/20 transition-transform duration-150 group-hover:scale-105">
                <IconPurchases className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Inward Stock
                </h4>
                <p className="text-[10px] font-medium text-slate-400">Add purchase bill</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onNavigate("invoices")}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-950/20 transition-transform duration-150 group-hover:scale-105">
                <IconInvoices className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Invoices
                </h4>
                <p className="text-[10px] font-medium text-slate-400">View bill history</p>
              </div>
            </button>
          )}

          <button
            onClick={() => onNavigate("products")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950/20 transition-transform duration-150 group-hover:scale-105">
              <IconPackage className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Products
              </h4>
              <p className="text-[10px] font-medium text-slate-400">
                {data?.totalProducts || 0} active items
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("reports")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md shadow-amber-950/20 transition-transform duration-150 group-hover:scale-105">
              <IconReports className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Reports
              </h4>
              <p className="text-[10px] font-medium text-slate-400">Sales & exports</p>
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-150 hover:shadow-sm hover:border-slate-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Today's Total Sales</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <IconReceipt className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              ₹{todaySales.toFixed(2)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Net revenue today
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-150 hover:shadow-sm hover:border-slate-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Today's Invoices</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <IconInvoices className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              {todayInvoiceCount}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              Completed checkout bills
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-150 hover:shadow-sm hover:border-slate-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Total Catalog Products</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <IconPackage className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              {totalProducts}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Active items in store
            </p>
          </div>

          {isInventoryEnabled && (
            <div
              className={`rounded-2xl border p-5 shadow-2xs transition-all duration-150 hover:shadow-sm ${
                lowStockCount > 0
                  ? "border-red-200 bg-red-50/30"
                  : "border-slate-200/80 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Low Stock Alert</p>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    lowStockCount > 0
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  ⚠️
                </span>
              </div>
              <p
                className={`mt-2 text-2xl font-black tracking-tight ${
                  lowStockCount > 0 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {lowStockCount} items
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {lowStockCount > 0 ? "Urgent reorder needed" : "All stocks healthy"}
              </p>
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <IconPackage className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Low Stock Watchlist
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate("products")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.category || "General"} • Alert at {item.lowStockAlert} {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.stockQuantity <= 0
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
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
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <IconReceipt className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Recent Bills
                </h3>
              </div>
              <button
                onClick={() => onNavigate("invoices")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
                    className="flex cursor-pointer items-center justify-between py-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[11px] text-slate-600 uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {(inv.customerName || "W")[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {inv.customerName || "Walk-in Customer"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono text-slate-600 font-medium">
                            {inv.invoiceNumber}
                          </span>
                          {" • "}
                          {new Date(inv.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
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
