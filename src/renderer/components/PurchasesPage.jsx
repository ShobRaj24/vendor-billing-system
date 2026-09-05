import { useEffect, useState } from "react";

function PurchasesPage({ products, onProductStockUpdated }) {
  const [tab, setTab] = useState("purchases"); // 'purchases' | 'suppliers'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase State
  const [showNewPurchase, setShowNewPurchase] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [billNumber, setBillNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");
  const [addItemCost, setAddItemCost] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Supplier Form State
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierError, setSupplierError] = useState("");

  // Inspecting Purchase Details Modal
  const [inspectingPurchase, setInspectingPurchase] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pList, sList] = await Promise.all([
          window.api.purchases.list(),
          window.api.suppliers.list(),
        ]);
        setPurchases(pList);
        setSuppliers(sList);
      } catch (err) {
        console.error("Failed to load purchases/suppliers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Purchase item addition
  function handleAddItemToPurchase() {
    setPurchaseError("");
    if (!selectedProductId) {
      setPurchaseError("Select a product to add.");
      return;
    }
    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    const qty = Number(addItemQty);
    const cost = Number(addItemCost);

    if (!Number.isFinite(qty) || qty <= 0) {
      setPurchaseError("Quantity must be greater than 0.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setPurchaseError("Cost price must be a valid non-negative amount.");
      return;
    }

    // Check if already in list
    const existing = purchaseItems.find((i) => i.productId === product.id);
    if (existing) {
      setPurchaseItems((items) =>
        items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty, costPrice: cost }
            : i,
        ),
      );
    } else {
      setPurchaseItems((items) => [
        ...items,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantity: qty,
          costPrice: cost,
        },
      ]);
    }

    setSelectedProductId("");
    setAddItemQty("1");
    setAddItemCost("");
  }

  function handleRemovePurchaseItem(productId) {
    setPurchaseItems((items) => items.filter((i) => i.productId !== productId));
  }

  async function handleSavePurchase(e) {
    if (e) e.preventDefault();
    if (purchaseItems.length === 0) {
      setPurchaseError("Add at least one item to this inward bill.");
      return;
    }

    try {
      setSavingPurchase(true);
      setPurchaseError("");
      const saved = await window.api.purchases.create({
        supplierId: selectedSupplier ? selectedSupplier.id : null,
        supplierName: selectedSupplier ? selectedSupplier.name : "Cash Supplier",
        billNumber: billNumber.trim() || null,
        notes: notes.trim() || null,
        items: purchaseItems,
      });

      setPurchases((current) => [saved, ...current]);
      setShowNewPurchase(false);
      setPurchaseItems([]);
      setBillNumber("");
      setNotes("");
      setSelectedSupplier(null);

      if (onProductStockUpdated) {
        onProductStockUpdated();
      }
    } catch (err) {
      console.error("Failed to save purchase:", err);
      setPurchaseError(err.message || "Failed to save purchase.");
    } finally {
      setSavingPurchase(false);
    }
  }

  // Supplier Actions
  async function handleSaveSupplier(e) {
    if (e) e.preventDefault();
    if (!supplierDraft.name.trim()) {
      setSupplierError("Supplier name is required.");
      return;
    }

    try {
      setSupplierError("");
      if (editingSupplier) {
        const updated = await window.api.suppliers.update({
          id: editingSupplier.id,
          ...supplierDraft,
        });
        setSuppliers((list) =>
          list.map((s) => (s.id === updated.id ? updated : s)),
        );
      } else {
        const created = await window.api.suppliers.create(supplierDraft);
        setSuppliers((list) => [created, ...list]);
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setSupplierDraft({ name: "", phone: "", email: "", address: "", gstin: "" });
    } catch (err) {
      console.error("Failed to save supplier:", err);
      setSupplierError(err.message || "Failed to save supplier.");
    }
  }

  async function handleDeactivateSupplier(supplier) {
    if (!window.confirm(`Deactivate supplier "${supplier.name}"?`)) return;
    try {
      await window.api.suppliers.deactivate(supplier.id);
      setSuppliers((list) => list.filter((s) => s.id !== supplier.id));
    } catch (err) {
      alert("Could not deactivate supplier: " + (err.message || err));
    }
  }

  const purchaseTotal = purchaseItems.reduce(
    (sum, i) => sum + i.quantity * i.costPrice,
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
      {/* Header with Sub-tabs */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Purchases & Supplier Inward
          </h2>
          <p className="text-xs text-slate-500">
            Record incoming stock, vendor invoices, and manage suppliers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium bg-slate-100">
            <button
              onClick={() => setTab("purchases")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                tab === "purchases"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inward Bills
            </button>
            <button
              onClick={() => setTab("suppliers")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                tab === "suppliers"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
          </div>

          {tab === "purchases" && (
            <button
              onClick={() => setShowNewPurchase(true)}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              + New Inward Bill
            </button>
          )}

          {tab === "suppliers" && (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierDraft({
                  name: "",
                  phone: "",
                  email: "",
                  address: "",
                  gstin: "",
                });
                setShowSupplierForm(true);
              }}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              + Add Supplier
            </button>
          )}
        </div>
      </header>

      <div className="p-6">
        {/* TAB 1: PURCHASES / INWARD BILLS */}
        {tab === "purchases" && (
          <div className="space-y-6">
            {/* New Inward Bill Form Modal */}
            {showNewPurchase && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
              >
                <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Record Inward Purchase Bill
                      </h3>
                      <p className="text-xs text-slate-500">
                        Stock quantities will automatically increment upon saving.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewPurchase(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6 space-y-4">
                    {purchaseError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {purchaseError}
                      </div>
                    )}

                    {/* Bill Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="mb-1 block font-medium text-slate-700">
                          Supplier
                        </label>
                        <select
                          value={selectedSupplier ? selectedSupplier.id : ""}
                          onChange={(e) => {
                            const found = suppliers.find(
                              (s) => s.id === Number(e.target.value),
                            );
                            setSelectedSupplier(found || null);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                        >
                          <option value="">Cash / One-time Supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.phone ? `(${s.phone})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-slate-700">
                          Supplier Bill / Invoice # (Optional)
                        </label>
                        <input
                          value={billNumber}
                          onChange={(e) => setBillNumber(e.target.value)}
                          placeholder="e.g. SUP-9842"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                        />
                      </div>
                    </div>

                    {/* Add Items Box */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Add Items to Bill
                      </h4>
                      <div className="grid grid-cols-12 gap-2 text-xs items-end">
                        <div className="col-span-6">
                          <label className="mb-1 block font-medium text-slate-600">
                            Product
                          </label>
                          <select
                            value={selectedProductId}
                            onChange={(e) => {
                              setSelectedProductId(e.target.value);
                              const p = products.find(
                                (item) => item.id === Number(e.target.value),
                              );
                              if (p && !addItemCost) {
                                // Default cost suggestion to 70% of selling price or blank
                                setAddItemCost(String(Math.round(p.sellingPrice * 0.75)));
                              }
                            }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                          >
                            <option value="">Select a product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.unit}) — Current Stock: {p.stockQuantity}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="mb-1 block font-medium text-slate-600">
                            Inward Qty
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={addItemQty}
                            onChange={(e) => setAddItemQty(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="mb-1 block font-medium text-slate-600">
                            Cost Price (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={addItemCost}
                            onChange={(e) => setAddItemCost(e.target.value)}
                            placeholder="Cost"
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                          />
                        </div>

                        <div className="col-span-2">
                          <button
                            type="button"
                            onClick={handleAddItemToPurchase}
                            className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-right">Inward Qty</th>
                            <th className="px-3 py-2 text-right">Cost Price</th>
                            <th className="px-3 py-2 text-right">Line Total</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseItems.map((item) => (
                            <tr key={item.productId} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {item.productName} ({item.unit})
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">
                                +{item.quantity}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                ₹{item.costPrice.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                ₹{(item.quantity * item.costPrice).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchaseItem(item.productId)}
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {purchaseItems.length === 0 && (
                        <p className="p-4 text-center text-xs text-slate-400">
                          No items added yet. Select products above.
                        </p>
                      )}
                    </div>

                    {/* Total summary */}
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">Total Purchase Value:</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{purchaseTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewPurchase(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingPurchase || purchaseItems.length === 0}
                      onClick={handleSavePurchase}
                      className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                    >
                      {savingPurchase ? "Saving..." : "Save & Update Stock"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Purchases History Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Purchase #</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">Bill / Ref #</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Items Inward</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    const totalQty = p.items.reduce(
                      (sum, i) => sum + Number(i.quantity),
                      0,
                    );
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {p.purchaseNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {p.supplierName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {p.billNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.items.length} items (+{totalQty})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ₹{p.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setInspectingPurchase(p)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {purchases.length === 0 && (
                <div className="p-12 text-center text-xs text-slate-500">
                  No inward purchase bills recorded yet. Click "+ New Inward Bill" above to add stock.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SUPPLIERS */}
        {tab === "suppliers" && (
          <div className="space-y-4">
            {showSupplierForm && (
              <form
                onSubmit={handleSaveSupplier}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </h3>

                {supplierError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {supplierError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Supplier Name *</label>
                    <input
                      required
                      value={supplierDraft.name}
                      onChange={(e) =>
                        setSupplierDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      placeholder="e.g. Metro Wholesale Distributers"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Phone</label>
                    <input
                      value={supplierDraft.phone}
                      onChange={(e) =>
                        setSupplierDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                      placeholder="e.g. +91 9876543210"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Email</label>
                    <input
                      value={supplierDraft.email}
                      onChange={(e) =>
                        setSupplierDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      placeholder="supplier@mail.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-700">GSTIN / Tax ID</label>
                    <input
                      value={supplierDraft.gstin}
                      onChange={(e) =>
                        setSupplierDraft((d) => ({ ...d, gstin: e.target.value }))
                      }
                      placeholder="GSTIN"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block font-medium text-slate-700">Address</label>
                    <textarea
                      rows={2}
                      value={supplierDraft.address}
                      onChange={(e) =>
                        setSupplierDraft((d) => ({ ...d, address: e.target.value }))
                      }
                      placeholder="Warehouse or shop address"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {editingSupplier ? "Update Supplier" : "Save Supplier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupplierForm(false);
                      setEditingSupplier(null);
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Supplier Name</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">GSTIN</th>
                    <th className="px-4 py-3 text-left">Address</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.gstin || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{s.address || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupplierDraft({
                              name: s.name,
                              phone: s.phone || "",
                              email: s.email || "",
                              address: s.address || "",
                              gstin: s.gstin || "",
                            });
                            setShowSupplierForm(true);
                          }}
                          className="mr-2 text-slate-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivateSupplier(s)}
                          className="text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {suppliers.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  No suppliers registered yet. Click "+ Add Supplier" to start.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Items Inspecting Modal */}
      {inspectingPurchase && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {inspectingPurchase.purchaseNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Supplier: {inspectingPurchase.supplierName} • {new Date(inspectingPurchase.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setInspectingPurchase(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2 text-left">Product</th>
                    <th className="pb-2 text-right">Inward Qty</th>
                    <th className="pb-2 text-right">Cost Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectingPurchase.items.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100">
                      <td className="py-2 font-medium text-slate-800">{i.productName}</td>
                      <td className="py-2 text-right font-semibold text-emerald-700">+{i.quantity}</td>
                      <td className="py-2 text-right text-slate-600">₹{i.costPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold text-slate-900">₹{i.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-xs font-bold text-slate-900">
              <span>Total Inward Value:</span>
              <span>₹{inspectingPurchase.totalAmount.toFixed(2)}</span>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setInspectingPurchase(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchasesPage;
