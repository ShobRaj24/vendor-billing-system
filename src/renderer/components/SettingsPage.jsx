import { useEffect, useState } from "react";

const defaultSettings = {
  storeName: "Vendor Billing",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  receiptHeader: "Tax Invoice",
  receiptFooter: "Thank you for your business. Please visit again.",
  defaultPrintFormat: "A4",
  currencySymbol: "₹",
};

function SettingsPage({ onSettingsSaved }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await window.api.settings.get();
        if (data) {
          setSettings(data);
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold">Store & Billing Settings</h2>
        <p className="text-xs text-slate-500">
          Configure your business profile, receipt headers, and printing preferences.
        </p>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        {savedSuccess && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          >
            <span>Settings saved successfully!</span>
            <button
              onClick={() => setSavedSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

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
              Control the default look, format, and messages on your printed bills.
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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
