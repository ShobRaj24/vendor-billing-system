import { useEffect, useState } from "react";

const emptyCustomer = {
  name: "",
  phone: "",
  address: "",
};

function CustomerManagement() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [draft, setDraft] = useState(emptyCustomer);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        const result = await window.api.customers.list(search);

        if (!cancelled) {
          setCustomers(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || String(loadError));
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [search]);

  async function openCustomerHistory(customer) {
    try {
      setSelectedCustomer(customer);
      setCustomerInvoices(await window.api.customers.invoices(customer.id));
    } catch (loadError) {
      setError(loadError?.message || String(loadError));
    }
  }

  function updateDraft(field, value) {
    setError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function openAddForm() {
    setEditingCustomer(null);
    setDraft(emptyCustomer);
    setError("");
    setShowForm(true);
  }

  function openEditForm(customer) {
    setEditingCustomer(customer);
    setDraft({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setError("");
    setShowForm(true);
  }

  async function saveCustomer() {
    if (!draft.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      const savedCustomer = editingCustomer
        ? await window.api.customers.update({ id: editingCustomer.id, ...draft })
        : await window.api.customers.create(draft);

      setCustomers((current) => {
        const withoutSaved = current.filter((item) => item.id !== savedCustomer.id);
        return [...withoutSaved, savedCustomer].sort((first, second) =>
          first.name.localeCompare(second.name),
        );
      });
      setShowForm(false);
      setEditingCustomer(null);
      setDraft(emptyCustomer);
    } catch (saveError) {
      setError(saveError?.message || String(saveError));
    }
  }

  async function deactivateCustomer(customer) {
    if (!window.confirm(`Deactivate "${customer.name}"?`)) {
      return;
    }

    try {
      await window.api.customers.deactivate(customer.id);
      setCustomers((current) => current.filter((item) => item.id !== customer.id));

      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
        setCustomerInvoices([]);
      }
    } catch (deactivateError) {
      setError(deactivateError?.message || String(deactivateError));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Customers</h2>
          <p className="text-xs text-slate-500">Manage billing customers</p>
        </div>
        <button
          onClick={openAddForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Customer
        </button>
      </header>

      <div className="space-y-4 p-6">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold">
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Customer name *"
                className="rounded-lg border px-3 py-2"
              />
              <input
                value={draft.phone}
                onChange={(event) => updateDraft("phone", event.target.value)}
                placeholder="Phone (optional)"
                className="rounded-lg border px-3 py-2"
              />
              <textarea
                value={draft.address}
                onChange={(event) => updateDraft("address", event.target.value)}
                placeholder="Address (optional)"
                className="min-h-24 rounded-lg border px-3 py-2 md:col-span-2"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveCustomer} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                {editingCustomer ? "Update Customer" : "Save Customer"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                  setDraft(emptyCustomer);
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or phone"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        />

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.address || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openCustomerHistory(customer)} className="mr-2 text-xs text-slate-700 hover:underline">History</button>
                    <button onClick={() => openEditForm(customer)} className="mr-2 text-xs text-slate-700 hover:underline">Edit</button>
                    <button onClick={() => deactivateCustomer(customer)} className="text-xs text-red-600 hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <p className="p-6 text-sm text-slate-500">No active customers found.</p>}
        </section>

        {selectedCustomer && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="font-semibold">{selectedCustomer.name} — Invoice History</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-sm text-slate-600 hover:underline">Close</button>
            </div>
            {customerInvoices.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No invoices for this customer.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {customerInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(invoice.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{invoice.finalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default CustomerManagement;
