import { useEffect, useMemo, useState } from "react";

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPresetDates(preset) {
  const today = new Date();
  const end = toDateInputValue(today);

  if (preset === "today") {
    return { from: end, to: end };
  }

  if (preset === "yesterday") {
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    const yStr = toDateInputValue(y);
    return { from: yStr, to: yStr };
  }

  if (preset === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { from: toDateInputValue(start), to: end };
  }

  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateInputValue(start), to: end };
  }

  if (preset === "last-month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toDateInputValue(start), to: toDateInputValue(lastDay) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toDateInputValue(start), to: end };
}

function formatCurrency(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

function downloadCsv(filename, headers, rows) {
  const headerRow = headers.map(escapeCsvCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCsvCell).join(","));
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportsPage({ onOpenInvoice }) {
  const [preset, setPreset] = useState("month");
  const [dateRange, setDateRange] = useState(() => getPresetDates("month"));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const result = await window.api.reports.sales(dateRange);

        if (!cancelled) {
          setReport(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || String(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  function selectPreset(nextPreset) {
    setPreset(nextPreset);
    setDateRange(getPresetDates(nextPreset));
  }

  function updateDateRange(field, value) {
    setPreset("custom");
    setDateRange((current) => ({ ...current, [field]: value }));
  }

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    if (!report?.invoices) return [];
    const query = invoiceSearch.trim().toLowerCase();
    if (!query) return report.invoices;

    return report.invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(query)),
    );
  }, [report?.invoices, invoiceSearch]);

  const filteredProducts = useMemo(() => {
    if (!report?.productSales) return [];
    const query = productSearch.trim().toLowerCase();
    if (!query) return report.productSales;

    return report.productSales.filter((p) =>
      p.productName.toLowerCase().includes(query),
    );
  }, [report?.productSales, productSearch]);

  // Export actions
  function handleExportInvoices() {
    if (!report?.invoices || report.invoices.length === 0) return;

    const headers = [
      "Invoice Number",
      "Date",
      "Time",
      "Customer",
      "Items Count",
      "Total MRP (INR)",
      "Product Discount (INR)",
      "Additional Discount (INR)",
      "Net Amount (INR)",
    ];

    const rows = report.invoices.map((inv) => {
      const d = new Date(inv.createdAt);
      return [
        inv.invoiceNumber,
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        inv.customerName || "Walk-in Customer",
        inv.items.length,
        inv.totalMrp.toFixed(2),
        inv.productDiscount.toFixed(2),
        inv.additionalDiscount.toFixed(2),
        inv.finalAmount.toFixed(2),
      ];
    });

    const filename = `sales-invoices_${dateRange.from || "start"}_to_${dateRange.to || "end"}.csv`;
    downloadCsv(filename, headers, rows);
    setShowExportMenu(false);
  }

  function handleExportProductSales() {
    if (!report?.productSales || report.productSales.length === 0) return;

    const headers = [
      "Product Name",
      "Unit",
      "Quantity Sold",
      "Invoices Count",
      "Sales Amount (INR)",
    ];

    const rows = report.productSales.map((p) => [
      p.productName,
      p.unit,
      p.quantitySold,
      p.invoiceCount,
      p.salesAmount.toFixed(2),
    ]);

    const filename = `product-sales_${dateRange.from || "start"}_to_${dateRange.to || "end"}.csv`;
    downloadCsv(filename, headers, rows);
    setShowExportMenu(false);
  }

  // Calculated KPIs
  const invoiceCount = report?.summary?.invoiceCount || 0;
  const netSales = report?.summary?.netSales || 0;
  const itemsSold = report?.summary?.itemsSold || 0;
  const totalMrp = report?.summary?.totalMrp || 0;
  const totalDiscount =
    (report?.summary?.productDiscount || 0) +
    (report?.summary?.additionalDiscount || 0);

  const avgOrderValue = invoiceCount > 0 ? netSales / invoiceCount : 0;
  const avgItemsPerBill =
    invoiceCount > 0 ? (itemsSold / invoiceCount).toFixed(1) : "0";
  const effectiveDiscountRate =
    totalMrp > 0 ? ((totalDiscount / totalMrp) * 100).toFixed(1) : "0";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reports & Analytics</h2>
          <p className="text-xs text-slate-500">
            Review sales performance, customer trends, and export accounting data.
          </p>
        </div>

        {/* Export Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu((current) => !current)}
            disabled={loading || !report || report.summary.invoiceCount === 0}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>📥 Export Data</span>
            <span className="text-[10px]">▼</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={handleExportInvoices}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>📄</span>
                <span>Export Invoices (CSV)</span>
              </button>
              <button
                type="button"
                onClick={handleExportProductSales}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>📦</span>
                <span>Export Product Sales (CSV)</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  window.print();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>🖨️</span>
                <span>Print Summary Sheet</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-6 p-6">
        {/* Date Filter Controls */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["today", "Today"],
                ["yesterday", "Yesterday"],
                ["week", "Last 7 Days"],
                ["month", "This Month"],
                ["last-month", "Last Month"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => selectPreset(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    preset === value
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-slate-600">
                <span className="mb-1 block font-medium">From</span>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => updateDateRange("from", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-slate-500"
                />
              </label>
              <label className="text-xs text-slate-600">
                <span className="mb-1 block font-medium">To</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(event) => updateDateRange("to", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-slate-500"
                />
              </label>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading sales report...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Could not load the report. {error}
          </div>
        ) : (
          <>
            {/* 6 Metric KPI Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <ReportCard
                label="Net Sales"
                value={formatCurrency(netSales)}
                accent="border-l-4 border-l-slate-900"
              />
              <ReportCard
                label="Total Invoices"
                value={invoiceCount}
              />
              <ReportCard
                label="Items Sold"
                value={itemsSold}
              />
              <ReportCard
                label="Total Discounts"
                value={formatCurrency(totalDiscount)}
              />
              <ReportCard
                label="Avg Order Value (AOV)"
                value={formatCurrency(avgOrderValue)}
                subtext={`${avgItemsPerBill} items / bill`}
              />
              <ReportCard
                label="Discount Rate"
                value={`${effectiveDiscountRate}%`}
                subtext="of total MRP"
              />
            </section>

            {/* Sales Summary & Top Products */}
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xs">
                <h3 className="font-semibold text-slate-900">Sales & Margin Breakdown</h3>
                <dl className="mt-4 space-y-3">
                  <SummaryRow
                    label="Gross MRP Sales"
                    value={formatCurrency(report.summary.totalMrp)}
                  />
                  <SummaryRow
                    label="Product-Level Discount"
                    value={`-${formatCurrency(report.summary.productDiscount)}`}
                  />
                  <SummaryRow
                    label="Additional Cart Discount"
                    value={`-${formatCurrency(report.summary.additionalDiscount)}`}
                  />
                  <SummaryRow
                    label="Net Realized Sales"
                    value={formatCurrency(netSales)}
                    emphasized
                  />
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xs">
                <h3 className="font-semibold text-slate-900">Top 5 Bestselling Products</h3>
                {report.productSales.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">No product sales in this range.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {report.productSales.slice(0, 5).map((product, idx) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">{product.productName}</p>
                            <p className="text-xs text-slate-500">
                              {product.quantitySold} {product.unit} · {product.invoiceCount} bills
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(product.salesAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Invoices Table with Search */}
            <ReportTable
              title="Invoice-wise Sales"
              badge={`${filteredInvoices.length} invoices`}
              headerRight={
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Filter invoices by # or customer..."
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-slate-500 w-64"
                />
              }
              emptyMessage="No invoices found for this query."
              isEmpty={filteredInvoices.length === 0}
            >
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => onOpenInvoice(invoice)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {invoice.customerName || "Walk-in Customer"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(invoice.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {invoice.items.length}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(
                          invoice.productDiscount + invoice.additionalDiscount,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(invoice.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportTable>

            {/* Product Sales Table with Search */}
            <ReportTable
              title="Product Sales Breakdown"
              badge={`${filteredProducts.length} items`}
              headerRight={
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter products..."
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-slate-500 w-64"
                />
              }
              emptyMessage="No products match your search."
              isEmpty={filteredProducts.length === 0}
            >
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 text-right">Quantity Sold</th>
                    <th className="px-4 py-3 text-right">Invoices Count</th>
                    <th className="px-4 py-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.productId}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{product.productName}</p>
                        <p className="text-[10px] text-slate-400">{product.unit}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {product.quantitySold}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {product.invoiceCount}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(product.salesAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportTable>
          </>
        )}
      </div>
    </div>
  );
}

function ReportCard({ label, value, subtext, accent = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${accent}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="mt-0.5 text-[11px] text-slate-400">{subtext}</p>}
    </div>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div
      className={`flex justify-between ${
        emphasized
          ? "border-t border-slate-200 pt-3 text-base font-bold text-slate-900"
          : "text-slate-600"
      }`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReportTable({ title, badge, headerRight, emptyMessage, isEmpty, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {badge}
            </span>
          )}
        </div>
        {headerRight}
      </div>
      {isEmpty ? (
        <p className="p-8 text-center text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-auto">{children}</div>
      )}
    </section>
  );
}

export default ReportsPage;
