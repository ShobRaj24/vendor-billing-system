import { useEffect, useState } from "react";

const defaultSettings = {
  storeName: "Vendor Billing",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  invoicePrefix: "INV-",
  receiptHeader: "Tax Invoice",
  receiptFooter: "Thank you for your business. Please visit again.",
  defaultPrintFormat: "A4",
  currencySymbol: "₹",
  enableInventory: false,
};

function SettingsPage({ onSettingsSaved }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  // Backup State
  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await window.api.settings.get();
        if (data) {
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (loadError) {
        console.error("Failed to load settings:", loadError);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(field, value) {
    setError("");
    setSavedSuccess(false);
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!settings.storeName.trim()) {
      setError("Store name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const updated = await window.api.settings.save(settings);
      setSettings(updated);
      setSavedSuccess(true);
      if (onSettingsSaved) {
        onSettingsSaved(updated);
      }
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (saveError) {
      console.error("Failed to save settings:", saveError);
      setError(saveError?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    try {
      setBackingUp(true);
      setBackupMsg("");
      const result = await window.api.settings.backup();
      if (result?.success) {
        setBackupMsg(`Backup saved to: ${result.filePath}`);
      }
    } catch (err) {
      alert("Backup failed: " + (err.message || err));
    } finally {
      setBackingUp(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
      {/* Floating Persistent Toast Notification */}
      {savedSuccess && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl transition-all"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
            ✓
          </span>
          <span>Settings saved successfully!</span>
          <button
            onClick={() => setSavedSuccess(false)}
            className="ml-2 rounded p-0.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-red-300 bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl transition-all"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
            ⚠️
          </span>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-2 rounded p-0.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with quick save action */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Store & Billing Settings</h2>
          <p className="text-xs text-slate-500">
            Configure your business profile, receipt headers, and printing preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all ${
            savedSuccess
              ? "bg-emerald-600 text-white"
              : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          }`}
        >
          {saving ? "Saving..." : savedSuccess ? "✓ Saved!" : "Save Settings"}
        </button>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Business Profile */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Business Profile
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              These details will appear at the top of printed invoices and customer bills.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Store / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => updateField("storeName", e.target.value)}
                  placeholder="e.g. Apex Supermarket"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Contact Phone / Mobile
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. contact@mystore.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Store Address
                </label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="e.g. Shop #12, Market Square, Main Road"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  GSTIN / Tax Number (Optional)
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => updateField("gstin", e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Receipt & Printing Preferences */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Receipt & Printing Preferences
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Control the default look, format, and numbering prefix on your printed bills.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Receipt Header Title
                </label>
                <input
                  type="text"
                  value={settings.receiptHeader}
                  onChange={(e) => updateField("receiptHeader", e.target.value)}
                  placeholder="e.g. Tax Invoice, Cash Receipt"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={settings.invoicePrefix || "INV-"}
                  onChange={(e) => updateField("invoicePrefix", e.target.value)}
                  placeholder="e.g. INV- or BILL-"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => updateField("currencySymbol", e.target.value)}
                  placeholder="e.g. ₹ or $"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Default Print Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "A4", name: "A4 Paper", desc: "Full page invoice" },
                    { id: "80mm", name: "80mm POS", desc: "Standard thermal receipt" },
                    { id: "58mm", name: "58mm POS", desc: "Compact thermal receipt" },
                  ].map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => updateField("defaultPrintFormat", format.id)}
                      className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${
                        settings.defaultPrintFormat === format.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <span className="text-sm font-semibold">{format.name}</span>
                      <span
                        className={`text-xs ${
                          settings.defaultPrintFormat === format.id
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        {format.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={settings.receiptFooter}
                  onChange={(e) => updateField("receiptFooter", e.target.value)}
                  placeholder="e.g. Thank you for your business. Visit again!"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Add-ons & Optional Modules */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Add-ons & Optional Modules
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Enable or disable advanced business features to keep your interface clean and simple.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Plug-in System
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Inventory & Supplier Purchases
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                        settings.enableInventory
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {settings.enableInventory ? "ENABLED" : "OFF (DEFAULT)"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Track live warehouse/store stock levels, receive inward supplier bills, adjust stock, and view low-stock alerts. When turned off, the app operates as a lightweight, lightning-fast POS billing system.
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.enableInventory)}
                    onChange={(e) =>
                      updateField("enableInventory", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-slate-900 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Database & Backup Management */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Database & Backup
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Create an offline backup copy of your local SQLite billing database.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={backingUp}
                onClick={handleBackup}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <span>💾</span>
                <span>{backingUp ? "Backing up..." : "Backup Database (.db)"}</span>
              </button>

              {backupMsg && (
                <span className="text-xs font-medium text-emerald-700">
                  ✓ {backupMsg}
                </span>
              )}
            </div>
          </section>

          {/* Receipt Preview Preview */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Receipt Header & Footer Preview
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Preview of how your business identity will be printed.
            </p>

            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <h4 className="text-lg font-bold text-slate-900">
                {settings.storeName || "Store Name"}
              </h4>
              {settings.address && (
                <p className="mt-0.5 text-xs text-slate-600">{settings.address}</p>
              )}
              {(settings.phone || settings.email) && (
                <p className="mt-0.5 text-xs text-slate-600">
                  {[settings.phone && `Tel: ${settings.phone}`, settings.email]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}
              {settings.gstin && (
                <p className="mt-0.5 text-xs font-medium text-slate-700">
                  GSTIN: {settings.gstin}
                </p>
              )}
              <div className="my-2 border-b border-dashed border-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {settings.receiptHeader || "Tax Invoice"}
              </p>
              <div className="my-2 border-b border-dashed border-slate-300" />
              <p className="text-xs text-slate-400 italic">[ Items & Totals ]</p>
              <div className="my-2 border-b border-dashed border-slate-300" />
              <p className="text-xs text-slate-600">
                {settings.receiptFooter || "Thank you for shopping with us!"}
              </p>
            </div>
          </section>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                savedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              }`}
            >
              {saving ? "Saving..." : savedSuccess ? "✓ Settings Saved!" : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
