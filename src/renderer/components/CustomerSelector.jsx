import { useEffect, useState } from "react";

function CustomerSelector({ customer, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
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
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
      >
        Change
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="mt-2 max-h-64 overflow-auto text-sm">
            <button
              onClick={() => selectCustomer(null)}
              className={`w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${
                customer === null ? "bg-slate-100 font-medium" : ""
              }`}
            >
              Walk-in Customer
            </button>

            {error ? (
              <p className="px-3 py-2 text-red-600">{error}</p>
            ) : customers.length === 0 ? (
              <p className="px-3 py-2 text-slate-500">No customers found.</p>
            ) : (
              customers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectCustomer(item)}
                  className={`w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${
                    customer?.id === item.id ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  <span className="block">{item.name}</span>
                  {item.phone && (
                    <span className="block text-xs text-slate-500">{item.phone}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSelector;
