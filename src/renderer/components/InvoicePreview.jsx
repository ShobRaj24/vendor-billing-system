import { useState } from "react";

function InvoicePreview({ invoice, onBack, settings }) {
  const [printFormat, setPrintFormat] = useState(
    settings?.defaultPrintFormat || "A4",
  );

  if (!invoice) {
    return null;
  }

  const currency = settings?.currencySymbol || "₹";
  const storeName = settings?.storeName || "Vendor Billing";
  const receiptHeader = settings?.receiptHeader || "Invoice";
  const receiptFooter =
    settings?.receiptFooter || "Thank you for your business.";

  const formatClass =
    printFormat === "80mm"
      ? "invoice-80mm max-w-[80mm]"
      : printFormat === "58mm"
        ? "invoice-58mm max-w-[58mm]"
        : "invoice-A4 max-w-[210mm]";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <p className="text-xs text-slate-500">{invoice.invoiceNumber}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Format selector */}
          <div className="flex rounded-lg border border-slate-300 p-0.5 text-xs font-medium">
            {[
              { id: "A4", label: "A4" },
              { id: "80mm", label: "80mm Thermal" },
              { id: "58mm", label: "58mm Thermal" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPrintFormat(f.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  printFormat === f.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={onBack}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Print
          </button>
        </div>
      </header>

      {/* Invoice Document */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className={`invoice-print ${formatClass} mx-auto rounded-lg bg-white p-6 shadow-sm`}
        >
          {/* Invoice heading */}
          <div
            className={`border-b border-slate-200 pb-5 ${
              printFormat === "58mm" || printFormat === "80mm"
                ? "text-center space-y-2"
                : "flex items-start justify-between"
            }`}
          >
            <div>
              <h1
                className={`font-bold text-slate-900 ${
                  printFormat === "58mm"
                    ? "text-base"
                    : printFormat === "80mm"
                      ? "text-lg"
                      : "text-2xl"
                }`}
              >
                {storeName}
              </h1>
              {settings?.address && (
                <p className="mt-0.5 text-xs text-slate-500">{settings.address}</p>
              )}
              {(settings?.phone || settings?.email) && (
                <p className="text-xs text-slate-500">
                  {[settings?.phone && `Tel: ${settings.phone}`, settings?.email]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}
              {settings?.gstin && (
                <p className="text-xs font-medium text-slate-600">
                  GSTIN: {settings.gstin}
                </p>
              )}
              <div className="mt-2">
                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {receiptHeader}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-800">
                Customer: {invoice.customerName || "Walk-in Customer"}
              </p>
            </div>

            <div
              className={`text-xs text-slate-500 ${
                printFormat === "58mm" || printFormat === "80mm"
                  ? "border-t border-dashed border-slate-200 pt-2 text-center"
                  : "text-right"
              }`}
            >
              <p className="font-semibold text-slate-800">
                {invoice.invoiceNumber}
              </p>
              <p className="mt-0.5">
                {new Date(invoice.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">{item.unit}</p>
                    </td>

                    <td className="py-2 text-right">{item.quantity}</td>

                    <td className="py-2 text-right">
                      {currency}
                      {item.sellingPrice.toFixed(2)}
                    </td>

                    <td className="py-2 text-right font-medium text-slate-900">
                      {currency}
                      {item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div
            className={`mt-5 space-y-1 text-xs ${
              printFormat === "58mm" || printFormat === "80mm"
                ? "w-full border-t border-dashed border-slate-200 pt-3"
                : "ml-auto w-64 border-t border-slate-200 pt-3"
            }`}
          >
            <div className="flex justify-between text-slate-500">
              <span>Total MRP</span>
              <span>
                {currency}
                {invoice.totalMrp.toFixed(2)}
              </span>
            </div>

            {invoice.productDiscount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Product Discount</span>
                <span>
                  -{currency}
                  {invoice.productDiscount.toFixed(2)}
                </span>
              </div>
            )}

            {invoice.additionalDiscount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Additional Discount</span>
                <span>
                  -{currency}
                  {invoice.additionalDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Final Amount</span>
              <span>
                {currency}
                {invoice.finalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-dashed border-slate-200 pt-4 text-center text-xs text-slate-500">
            {receiptFooter}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePreview;
