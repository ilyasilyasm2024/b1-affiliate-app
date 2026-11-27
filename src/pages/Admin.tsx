import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { affiliateService, type Influencer } from "../services/affiliate";

export default function Admin() {
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem("admin_secret") || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    referralCode: "",
    discountPercent: "10",
    firstPurchaseCommission: "50",
    renewalCommission: "20",
  });

  const authenticate = async () => {
    setError("");
    const res = await affiliateService.listInfluencers(adminSecret);
    if (res.data) {
      setAuthenticated(true);
      setInfluencers(res.data);
      localStorage.setItem("admin_secret", adminSecret);
    } else {
      setError(res.error || "Ungültiges Admin-Passwort");
    }
  };

  useEffect(() => {
    if (adminSecret && !authenticated) {
      authenticate();
    }
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await affiliateService.createInfluencer(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode || undefined,
        discountPercent: Number(form.discountPercent),
        firstPurchaseCommission: Number(form.firstPurchaseCommission),
        renewalCommission: Number(form.renewalCommission),
      },
      adminSecret
    );

    if (res.data) {
      setSuccess(`✓ Influencer "${res.data.name}" erstellt! Code: ${res.data.referralCode}`);
      setInfluencers((prev) => [res.data!, ...prev]);
      setForm({ name: "", email: "", password: "", referralCode: "", discountPercent: "10", firstPurchaseCommission: "50", renewalCommission: "20" });
    } else {
      setError(res.error || "Erstellung fehlgeschlagen");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">🔐 Admin Zugang</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Admin Secret eingeben"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={authenticate}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 cursor-pointer"
            >
              Einloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Admin: Influencer verwalten</h1>
          <Link to="/login" className="text-sm text-gray-500 hover:underline">→ Influencer Login</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Neuen Influencer erstellen</h2>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-3">{error}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded p-2 mb-3">{success}</p>}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="email"
              placeholder="E-Mail *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="text"
              placeholder="Passwort *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="text"
              placeholder="Referral Code (z.B. ILYAS20)"
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-xs text-gray-500">% Rabatt für Nutzer</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={form.firstPurchaseCommission}
                onChange={(e) => setForm({ ...form, firstPurchaseCommission: e.target.value })}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-xs text-gray-500">% Erstkauf-Provision</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={form.renewalCommission}
                onChange={(e) => setForm({ ...form, renewalCommission: e.target.value })}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-xs text-gray-500">% Verlängerung-Provision</span>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 cursor-pointer"
              >
                Influencer erstellen
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Alle Influencer ({influencers.length})</h2>
          </div>
          {influencers.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Noch keine Influencer erstellt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Code</th>
                    <th className="text-right px-4 py-2">Rabatt</th>
                    <th className="text-right px-4 py-2">1. Kauf</th>
                    <th className="text-right px-4 py-2">Verlängerung</th>
                    <th className="text-right px-4 py-2">Guthaben</th>
                    <th className="text-left px-4 py-2">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((inf) => (
                    <InfluencerRow key={inf._id} inf={inf} adminSecret={adminSecret} onUpdate={(updated) => {
                      setInfluencers((prev) => prev.map((i) => i._id === updated._id ? updated : i));
                    }} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfluencerRow({ inf, adminSecret, onUpdate }: { inf: Influencer; adminSecret: string; onUpdate: (i: Influencer) => void }) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState({
    discountPercent: inf.discountPercent,
    firstPurchaseCommission: inf.firstPurchaseCommission,
    renewalCommission: inf.renewalCommission,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await affiliateService.updateInfluencer(inf._id, vals, adminSecret);
    if (res.data) {
      onUpdate(res.data);
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-2">
        <p className="font-medium">{inf.name}</p>
        <p className="text-[10px] text-gray-400">{inf.email}</p>
      </td>
      <td className="px-4 py-2 font-mono text-xs">{inf.referralCode}</td>
      <td className="px-4 py-2 text-right">
        {editing ? (
          <input type="number" min="0" max="100" value={vals.discountPercent}
            onChange={(e) => setVals({ ...vals, discountPercent: Number(e.target.value) })}
            className="w-14 text-right border rounded px-1 py-0.5 text-xs"
          />
        ) : (
          <span>{inf.discountPercent}%</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        {editing ? (
          <input type="number" min="0" max="100" value={vals.firstPurchaseCommission}
            onChange={(e) => setVals({ ...vals, firstPurchaseCommission: Number(e.target.value) })}
            className="w-14 text-right border rounded px-1 py-0.5 text-xs"
          />
        ) : (
          <span className="text-emerald-700 font-medium">{inf.firstPurchaseCommission}%</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        {editing ? (
          <input type="number" min="0" max="100" value={vals.renewalCommission}
            onChange={(e) => setVals({ ...vals, renewalCommission: Number(e.target.value) })}
            className="w-14 text-right border rounded px-1 py-0.5 text-xs"
          />
        ) : (
          <span>{inf.renewalCommission}%</span>
        )}
      </td>
      <td className="px-4 py-2 text-right font-semibold text-emerald-700">{inf.balance.toFixed(2)}</td>
      <td className="px-4 py-2">
        {editing ? (
          <div className="flex gap-1">
            <button onClick={save} disabled={saving}
              className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "..." : "Speichern"}
            </button>
            <button onClick={() => setEditing(false)}
              className="text-[10px] text-gray-500 px-2 py-1 rounded cursor-pointer hover:bg-gray-100">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
            Bearbeiten
          </button>
        )}
      </td>
    </tr>
  );
}
