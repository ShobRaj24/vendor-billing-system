import { useEffect, useState } from "react";

function InvoiceHistory({ onOpenInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const result = await window.api.invoices.list();
        setInvoices(result);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Loading invoices...</div>
    );
  }

  if (invoices.length === 0) {
    return <div className="p-6 text-sm text-slate-500">No invoices found.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Invoice History</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => onOpenInvoice(invoice)}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium">
                  {invoice.invoiceNumber}
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {invoice.customerName || "Walk-in Customer"}
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {new Date(invoice.createdAt).toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right">{invoice.items.length}</td>

                <td className="px-4 py-3 text-right font-semibold">
                  ₹{invoice.finalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceHistory;
