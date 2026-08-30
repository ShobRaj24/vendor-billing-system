function InvoicePreview({ invoice, invoiceFormat, onBack }) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <p className="text-xs text-slate-500">{invoice.invoiceNumber}</p>
        </div>

        <div className="flex gap-2">
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

      {/* Invoice */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className={`invoice-print invoice-${invoiceFormat} mx-auto bg-white shadow-sm`}
        >
          {/* Invoice heading */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-bold">Vendor Billing</h1>
              <p className="mt-1 text-sm text-slate-500">Invoice</p>
            </div>

            <div className="text-right text-sm">
              <p className="font-semibold">{invoice.invoiceNumber}</p>

              <p className="mt-1 text-slate-500">
                {new Date(invoice.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left">Product</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium">{item.productName}</p>

                      <p className="text-xs text-slate-500">{item.unit}</p>
                    </td>

                    <td className="py-3 text-right">{item.quantity}</td>

                    <td className="py-3 text-right">
                      ₹{item.sellingPrice.toFixed(2)}
                    </td>

                    <td className="py-3 text-right font-medium">
                      ₹{item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 ml-auto w-72 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total MRP</span>
              <span>₹{invoice.totalMrp.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Product Discount</span>
              <span>₹{invoice.productDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Additional Discount</span>
              <span>₹{invoice.additionalDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <span>Final Amount</span>
              <span>₹{invoice.finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePreview;
