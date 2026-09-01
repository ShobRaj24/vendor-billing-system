import { useEffect, useState } from "react";

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

  if (preset === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { from: toDateInputValue(start), to: end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toDateInputValue(start), to: end };
}

function formatCurrency(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function ReportsPage({ onOpenInvoice }) {
  const [preset, setPreset] = useState("month");
  const [dateRange, setDateRange] = useState(() => getPresetDates("month"));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-xs text-slate-500">
          Review sales, invoices, discounts, and product performance.
        </p>
      </header>

      <div className="space-y-6 p-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                ["today", "Today"],
                ["week", "Last 7 Days"],
                ["month", "This Month"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => selectPreset(value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    preset === value
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block text-xs">From</span>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => updateDateRange("from", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block text-xs">To</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(event) => updateDateRange("to", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-sm text-slate-500">Loading report...</div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Could not load the report. {error}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReportCard
                label="Net Sales"
                value={formatCurrency(report.summary.netSales)}
              />
              <ReportCard
                label="Invoices"
                value={report.summary.invoiceCount}
              />
              <ReportCard
                label="Items Sold"
                value={report.summary.itemsSold}
              />
              <ReportCard
                label="Total Discounts"
                value={formatCurrency(
                  report.summary.productDiscount +
                    report.summary.additionalDiscount,
                )}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <h3 className="font-semibold">Sales Summary</h3>
                <dl className="mt-4 space-y-3">
                  <SummaryRow
                    label="Total MRP"
                    value={formatCurrency(report.summary.totalMrp)}
                  />
                  <SummaryRow
                    label="Product Discount"
                    value={formatCurrency(report.summary.productDiscount)}
                  />
                  <SummaryRow
                    label="Additional Discount"
                    value={formatCurrency(report.summary.additionalDiscount)}
                  />
                  <SummaryRow
                    label="Net Sales"
                    value={formatCurrency(report.summary.netSales)}
                    emphasized
                  />
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <h3 className="font-semibold">Top Products</h3>
                {report.productSales.length === 0 ? (
                  <p className="mt-4 text-slate-500">No product sales in this range.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {report.productSales.slice(0, 5).map((product) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-xs text-slate-500">
                            {product.quantitySold} {product.unit} · {product.invoiceCount} invoices
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(product.salesAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <ReportTable
              title="Invoice-wise Sales"
              emptyMessage="No invoices found for this date range."
              isEmpty={report.invoices.length === 0}
            >
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => onOpenInvoice(invoice)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(invoice.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice.items.length}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(
                          invoice.productDiscount + invoice.additionalDiscount,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(invoice.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportTable>

            <ReportTable
              title="Product Sales"
              emptyMessage="No products were sold in this date range."
              isEmpty={report.productSales.length === 0}
            >
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Quantity Sold</th>
                    <th className="px-4 py-3 text-right">Invoices</th>
                    <th className="px-4 py-3 text-right">Sales Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.productSales.map((product) => (
                    <tr
                      key={product.productId}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-slate-500">{product.unit}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.quantitySold}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.invoiceCount}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
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

function ReportCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div
      className={`flex justify-between ${
        emphasized ? "border-t border-slate-200 pt-3 font-semibold" : ""
      }`}
    >
      <dt className="text-slate-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReportTable({ title, emptyMessage, isEmpty, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-4 py-3 font-semibold">{title}</h3>
      {isEmpty ? (
        <p className="p-6 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-auto">{children}</div>
      )}
    </section>
  );
}

export default ReportsPage;
