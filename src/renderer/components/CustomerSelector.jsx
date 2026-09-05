import { useEffect, useState } from "react";

function CustomerSelector({ customer, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  // Quick-add state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState({ name: "", phone: "", address: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsAddingNew(false);
      setCreateError("");
      return;
    }

    let cancelled = false;

    async function loadCustomers() {
      try {
        const result = await window.api.customers.list(search);

        if (!cancelled) {
          setCustomers(result);
          setError("");
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
  }, [isOpen, search]);

  function selectCustomer(nextCustomer) {
    onChange(nextCustomer);
    setIsOpen(false);
    setSearch("");
    setIsAddingNew(false);
    setNewDraft({ name: "", phone: "", address: "" });
  }

  function startQuickAdd() {
    const trimmed = search.trim();
    const isPhoneNumber = /^[0-9+\s()-]{5,}$/.test(trimmed);

    setNewDraft({
      name: isPhoneNumber ? "" : trimmed,
      phone: isPhoneNumber ? trimmed : "",
      address: "",
    });
    setCreateError("");
    setIsAddingNew(true);
  }

  async function handleCreateCustomer(e) {
    if (e) e.preventDefault();
    if (!newDraft.name.trim()) {
      setCreateError("Customer name is required.");
      return;
    }

    try {
      setSavingNew(true);
      setCreateError("");
      const created = await window.api.customers.create(newDraft);
      selectCustomer(created);
    } catch (saveErr) {
      console.error("Failed to create customer:", saveErr);
      setCreateError(saveErr?.message || "Failed to create customer.");
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Change
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-88 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          {!isAddingNew ? (
            /* Search & Select Mode */
            <div>
              <div className="flex items-center justify-between pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Customer
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or phone number..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-slate-500"
              />

              <div className="mt-2 max-h-60 overflow-auto text-xs space-y-1">
                <button
                  onClick={() => selectCustomer(null)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${
                    customer === null ? "bg-slate-100 font-semibold" : ""
                  }`}
                >
                  <span>Walk-in Customer</span>
                  {customer === null && <span className="text-slate-500">✓</span>}
                </button>

                {error && <p className="px-3 py-2 text-red-600">{error}</p>}

                {customers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectCustomer(item)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${
                      customer?.id === item.id ? "bg-slate-100 font-semibold" : ""
                    }`}
                  >
                    <div>
                      <span className="block font-medium text-slate-900">{item.name}</span>
                      {item.phone && (
                        <span className="block text-[11px] text-slate-500">{item.phone}</span>
                      )}
                    </div>
                    {customer?.id === item.id && (
                      <span className="text-slate-500">✓</span>
                    )}
                  </button>
                ))}

                {customers.length === 0 && search.trim() && (
                  <div className="py-2 text-center">
                    <p className="text-slate-500">No matching customers.</p>
                    <button
                      onClick={startQuickAdd}
                      className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 py-2 font-medium text-slate-800 hover:bg-slate-100"
                    >
                      + Create "{search.trim()}" as new customer
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <button
                  onClick={startQuickAdd}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  <span>+ Add New Customer</span>
                </button>
              </div>
            </div>
          ) : (
            /* Quick Add Mode */
            <form onSubmit={handleCreateCustomer}>
              <div className="flex items-center justify-between pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  New Customer
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {createError}
                </div>
              )}

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Customer Name *
                  </label>
                  <input
                    autoFocus
                    required
                    value={newDraft.name}
                    onChange={(e) =>
                      setNewDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    value={newDraft.phone}
                    onChange={(e) =>
                      setNewDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Address (optional)
                  </label>
                  <input
                    value={newDraft.address}
                    onChange={(e) =>
                      setNewDraft((d) => ({ ...d, address: e.target.value }))
                    }
                    placeholder="e.g. Sector 4, City"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="flex-1 rounded-lg bg-slate-900 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingNew ? "Saving..." : "Save & Select"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerSelector;
