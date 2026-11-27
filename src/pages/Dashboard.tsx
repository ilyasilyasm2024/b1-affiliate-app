import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { affiliateService, type DashboardData } from "../services/affiliate";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  beta: "bg-amber-100 text-amber-700",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
  lifetime: "bg-emerald-100 text-emerald-800",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"overview" | "users" | "commissions" | "promos">("overview");

  useEffect(() => {
    if (!localStorage.getItem("influencer_token")) {
      navigate("/login");
      return;
    }
    affiliateService.getDashboard().then((res) => {
      if (res.data) {
        setData(res.data);
      } else {
        if (res.status === 401) {
          localStorage.removeItem("influencer_token");
          navigate("/login");
          return;
        }
        setError(res.error || "Fehler beim Laden");
      }
      setLoading(false);
    });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("influencer_token");
    localStorage.removeItem("influencer_name");
    navigate("/login");
  };

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-pulse text-lg text-gray-400 font-medium">Laden...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-500 text-sm">{error || "Keine Daten"}</p>
        <button onClick={logout} className="text-sm text-gray-600 underline cursor-pointer">Abmelden</button>
      </div>
    );
  }

  const { influencer, referralLink, stats, referrals, commissions } = data;
  const conversionRate = stats.totalReferrals > 0
    ? Math.round((stats.subscribedReferrals / stats.totalReferrals) * 100)
    : 0;

  // Monthly earnings for chart (last 6 months)
  const monthlyData = getMonthlyChart(commissions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {influencer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{influencer.name}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{influencer.referralCode}</span>
                <span>{influencer.discountPercent}% Rabatt · {influencer.commissionPercent}% Provision</span>
              </p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
            Abmelden
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Referral link card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80 mb-2">Dein Empfehlungslink</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 font-mono text-sm truncate">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="bg-white text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 cursor-pointer transition-colors whitespace-nowrap shadow"
            >
              {copied ? "✓ Kopiert!" : "Kopieren"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="💰" label="Guthaben" value={`${stats.balance.toFixed(2)} MAD`} accent />
          <StatCard icon="📈" label="Verdient (gesamt)" value={`${stats.totalEarned.toFixed(2)} MAD`} />
          <StatCard icon="👥" label="Empfohlene Nutzer" value={String(stats.totalReferrals)} />
          <StatCard icon="🎯" label="Conversion Rate" value={`${conversionRate}%`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly earnings bar chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Monatliche Einnahmen (MAD)</h3>
            <div className="flex items-end gap-2 h-32">
              {monthlyData.map((m) => {
                const height = monthlyData.length > 0
                  ? Math.max(4, (m.amount / (Math.max(...monthlyData.map((d) => d.amount)) || 1)) * 100)
                  : 4;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {m.amount > 0 ? m.amount.toFixed(0) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-gray-400">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut chart: subscribed vs not */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-gray-800 mb-4 self-start">Nutzer-Status</h3>
            <DonutChart
              subscribed={stats.subscribedReferrals}
              notSubscribed={stats.totalReferrals - stats.subscribedReferrals}
            />
            <div className="flex gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Abonniert ({stats.subscribedReferrals})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-300" /> Noch nicht ({stats.totalReferrals - stats.subscribedReferrals})
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {([["overview", "Übersicht"], ["users", "Nutzer"], ["commissions", "Provisionen"], ["promos", "Promo-Codes"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon="⏳" label="Ausstehend" value={`${stats.pendingTotal.toFixed(2)} MAD`} />
            <StatCard icon="✅" label="Ausgezahlt" value={`${stats.totalPaid.toFixed(2)} MAD`} />
            <StatCard icon="🔄" label="Conversion" value={`${stats.subscribedReferrals}/${stats.totalReferrals}`} />
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Empfohlene Nutzer ({referrals.length})</h2>
            </div>
            {referrals.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Noch keine empfohlenen Nutzer. Teile deinen Link!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {referrals.map((r, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {r.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.username}</p>
                        <p className="text-[11px] text-gray-400">{r.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.hasSubscribed ? (
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${getPlanBadge(r, commissions)}`}>
                          {getPlanName(r, commissions)}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">Free</span>
                      )}
                      <span className="text-[10px] text-gray-400">{shortDate(r.joinedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "commissions" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Provisionen ({commissions.length})</h2>
            </div>
            {commissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Noch keine Provisionen. Sobald ein empfohlener Nutzer ein Abo kauft, erscheinen die Einnahmen hier.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Nutzer</th>
                      <th className="text-left px-4 py-3 font-medium">Plan</th>
                      <th className="text-right px-4 py-3 font-medium">Bezahlt</th>
                      <th className="text-right px-4 py-3 font-medium">Provision</th>
                      <th className="text-left px-4 py-3 font-medium">Datum</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissions.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-800">{c.username}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PLAN_COLORS[c.plan] || PLAN_COLORS.free}`}>
                            {c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{c.amountPaid.toFixed(2)} MAD</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">+{c.commissionAmount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.purchasedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                            c.status === "paid" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {c.status === "paid" ? "Ausgezahlt" : "Ausstehend"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === "promos" && <PromoTab />}
      </div>
    </div>
  );
}

// --- Promo Tab ---

function PromoTab() {
  const [promos, setPromos] = useState<Array<{
    _id: string; code: string; plan: string; durationDays: number;
    isUsed: boolean; usedByUsername: string; usedAt: string | null;
    expiresAt: string; createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genPlan, setGenPlan] = useState("gold");
  const [genDays, setGenDays] = useState(30);
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    affiliateService.listPromos().then((res) => {
      if (res.data) setPromos(res.data);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    const res = await affiliateService.generatePromo(genPlan, genDays);
    if (res.data) {
      setMessage(`✓ Code erstellt: ${res.data.code}`);
      setRemaining(res.data.remaining);
      // Refresh list
      const list = await affiliateService.listPromos();
      if (list.data) setPromos(list.data);
    } else {
      setMessage(res.error || "Fehler");
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) return <p className="text-gray-400 text-sm">Laden...</p>;

  const usedCount = promos.filter((p) => p.isUsed).length;
  const activeCount = promos.filter((p) => !p.isUsed && new Date(p.expiresAt) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Generate section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Promo-Code generieren</h3>
        <p className="text-xs text-gray-500 mb-4">
          Erstelle Codes für Giveaways. Limit: 20 pro Monat.
          {remaining !== null && <span className="font-medium text-indigo-600"> ({remaining} verbleibend)</span>}
        </p>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-1">Plan</label>
            <select
              value={genPlan}
              onChange={(e) => setGenPlan(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-pointer"
            >
              <option value="silver">Silver (30 MAD/mo)</option>
              <option value="gold">Gold (50 MAD/mo)</option>
              <option value="platinum">Platinum (70 MAD/mo)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-1">Tage</label>
            <select
              value={genDays}
              onChange={(e) => setGenDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-pointer"
            >
              <option value={7}>7 Tage</option>
              <option value={14}>14 Tage</option>
              <option value={30}>30 Tage</option>
              <option value={60}>60 Tage</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 cursor-pointer disabled:opacity-50 shadow"
          >
            {generating ? "..." : "🎟️ Code generieren"}
          </button>
        </div>

        {message && (
          <p className={`mt-3 text-sm font-medium ${message.startsWith("✓") ? "text-emerald-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{promos.length}</p>
          <p className="text-[10px] text-gray-500">Erstellt (gesamt)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{usedCount}</p>
          <p className="text-[10px] text-gray-500">Eingelöst</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{activeCount}</p>
          <p className="text-[10px] text-gray-500">Aktiv (unbenutzt)</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Alle Promo-Codes ({promos.length})</h3>
        </div>
        {promos.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">Noch keine Codes generiert.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {promos.map((p) => {
              const expired = new Date(p.expiresAt) < new Date();
              return (
                <div key={p._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyCode(p.code)}
                      className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                      title="Kopieren"
                    >
                      {p.code}
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[p.plan] || ""}`}>
                      {p.plan} · {p.durationDays}d
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isUsed ? (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ✓ {p.usedByUsername}
                      </span>
                    ) : expired ? (
                      <span className="text-[10px] text-red-500">Abgelaufen</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Verfügbar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper components ---

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${
      accent ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50" : "border-gray-200 bg-white"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-indigo-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function DonutChart({ subscribed, notSubscribed }: { subscribed: number; notSubscribed: number }) {
  const total = subscribed + notSubscribed;
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <text x="50" y="54" textAnchor="middle" className="text-[10px] fill-gray-400">0</text>
      </svg>
    );
  }
  const pct = (subscribed / total) * 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - pct / 100);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle
        cx="50" cy="50" r="40" fill="none"
        stroke="#10b981" strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="48" textAnchor="middle" className="text-lg font-bold" fill="#111827">{pct.toFixed(0)}%</text>
      <text x="50" y="62" textAnchor="middle" className="text-[8px]" fill="#6b7280">Conversion</text>
    </svg>
  );
}

// --- Utility functions ---

function getMonthlyChart(commissions: DashboardData["commissions"]) {
  const months: Record<string, number> = {};
  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months[key] = 0;
  }
  for (const c of commissions) {
    if (c.period in months) {
      months[c.period] += c.commissionAmount;
    }
  }
  return Object.entries(months).map(([month, amount]) => ({
    month,
    amount,
    label: new Date(month + "-01").toLocaleDateString("de-DE", { month: "short" }),
  }));
}

function getPlanName(referral: DashboardData["referrals"][0], commissions: DashboardData["commissions"]): string {
  const latest = commissions.find((c) => c.username === referral.username);
  if (latest) return latest.plan.charAt(0).toUpperCase() + latest.plan.slice(1);
  return "Abonniert";
}

function getPlanBadge(referral: DashboardData["referrals"][0], commissions: DashboardData["commissions"]): string {
  const latest = commissions.find((c) => c.username === referral.username);
  const plan = latest?.plan || "free";
  return PLAN_COLORS[plan] || PLAN_COLORS.free;
}
