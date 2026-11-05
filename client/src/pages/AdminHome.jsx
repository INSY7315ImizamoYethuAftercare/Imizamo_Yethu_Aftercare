import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsButton from "../components/SettingsButton";
import { useSession } from "../services/session";
import { apiClient } from "../services/apiClient";
import { classOverviewRows } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { greeting, longDate, todayInSA } from "../utils/dates";
import { STAT_COLOURS } from "../utils/statColours";

// Admin dashboard. Admins can't see individual learners or the register
// (POPIA), so everything here is a total from GET /reports/overview. That is
// also why it has no Recent Activity list like the manager home.

function AdminHome() {
  const { displayName, displayRole } = useHeader();
  const { user } = useSession();
  const navigate = useNavigate();
  const [today, setToday] = useState(null);
  const [error, setError] = useState("");
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-3 shadow-lg border border-gray-200 flex items-center gap-3 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";
  const pct = (n, of) => (of > 0 ? Math.min(Math.round((n / of) * 100), 100) : 0);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/reports/overview")
      .then((report) => { if (!cancelled) setToday(report.today); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Couldn't load today's numbers."); });
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const classOverview = today
    ? classOverviewRows(today.classes.map((c) => ({ name: c.name, colour: c.colour, present: `${c.present}/${c.activeLearners}` })))
    : [];

  // Stat cards in the same style as the manager and teacher homes.
  const stats = today && [
    { label: "Present Today", icon: "✅", value: today.present, bar: pct(today.present, today.activeLearners), ...STAT_COLOURS.attendance },
    { label: "Signed Out", icon: "🚪", value: today.signedOut, bar: pct(today.signedOut, today.present), ...STAT_COLOURS.signOuts },
    // Spans the full width on a phone so the odd third card doesn't leave a gap.
    { label: "Total Learners", icon: "🎒", value: today.activeLearners, bar: 100, ...STAT_COLOURS.learners, wide: true },
  ];

  const actions = [
    { label: "Reports", icon: "📊", tint: "bg-sky-50", to: "/admin/reports" },
    { label: "Settings", icon: "⚙️", tint: "bg-orange-50", to: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Imizamo Yethu Learning Hub" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
            <SettingsButton />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        {/* Welcome banner with soft decorative circles, as on the other homes. */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <span aria-hidden="true" className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/15" />
          <span aria-hidden="true" className="absolute -bottom-12 right-20 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm opacity-90">{longDate(todayInSA())}</p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">{greeting()}, {firstName}! 👋</h1>
            {today && (
              <p className="text-sm mt-1 opacity-90">
                {today.present} of {today.activeLearners} learners present today
              </p>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}
        {!today && !error && <p className="text-sm text-gray-400 text-center py-6">Loading today's numbers...</p>}

        {today && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className={`${card} ${s.wide ? "col-span-2 md:col-span-1" : ""}`}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${s.tint}`} aria-hidden="true">
                  {s.icon}
                </span>
                <p className={`text-2xl font-bold mt-3 ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${s.fill}`} style={{ width: `${s.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {actions.map((a) => (
            <button key={a.to} onClick={() => navigate(a.to)} className={action}>
              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl ${a.tint}`} aria-hidden="true">
                {a.icon}
              </span>
              <span className="text-sm font-semibold text-gray-800 text-left leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {today && (
          <>
            <h2 className="font-semibold text-gray-900 mb-3">Class Overview</h2>
            <div className={`${card} grid grid-cols-1 md:grid-cols-2 gap-4`}>
              {classOverview.length === 0 && <p className="text-sm text-gray-400">No classes yet.</p>}
              {classOverview.map((cls) => (
                <div key={cls.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: cls.hex }}></span>
                      {cls.name}
                    </span>
                    <span className="text-gray-500">{cls.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: cls.width, backgroundColor: cls.hex }}></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminHome;
