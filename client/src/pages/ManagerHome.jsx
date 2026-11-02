import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsButton from "../components/SettingsButton";
import { useClasses, classOverviewRows } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { apiClient } from "../services/apiClient";
import { isMasterAdmin, useSession } from "../services/session";
import { greeting, longDate, todayInSA } from "../utils/dates";

function ManagerHome() {
  const { displayName, displayRole } = useHeader();
  const { user } = useSession();
  // The master admin is greeted by their role, everyone else by first name.
  const greetName = isMasterAdmin(user) ? "Master Admin" : user?.fullName?.split(" ")[0] || "there";

  // Today's totals (GET /reports/overview), the same numbers the admin sees.
  const [today, setToday] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/reports/overview")
      .then((report) => { if (!cancelled) setToday(report.today); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Couldn't load today's numbers."); });
    return () => { cancelled = true; };
  }, []);

  // Recent Activity: today's sign-outs (GET /signout/today), latest first.
  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState("");
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/signout/today")
      .then(({ learners }) => {
        if (cancelled) return;
        const signedOut = learners
          .filter((l) => l.signedOut)
          .sort((a, b) => b.signedOut.timeOut.localeCompare(a.signedOut.timeOut))
          .slice(0, 5);
        setActivity(signedOut);
      })
      .catch((e) => { if (!cancelled) setActivityError(e?.message || "Couldn't load today's sign-outs."); });
    return () => { cancelled = true; };
  }, []);
  const navigate = useNavigate();
  const classOverview = classOverviewRows(useClasses());
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-3 shadow-lg border border-gray-200 flex items-center gap-3 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition relative";
  const pct = (n, of) => (of > 0 ? Math.min(Math.round((n / of) * 100), 100) : 0);

  // Stat cards in the same style as the teacher home: tinted icon, coloured number, progress bar.
  const stats = today && [
    { label: "Present Today", icon: "✅", value: today.present, bar: pct(today.present, today.activeLearners), tint: "bg-green-50", text: "text-green-600", fill: "bg-green-500" },
    { label: "Signed Out", icon: "🚪", value: today.signedOut, bar: pct(today.signedOut, today.present), tint: "bg-purple-50", text: "text-purple-600", fill: "bg-purple-500" },
    { label: "Total Learners", icon: "🎒", value: today.activeLearners, bar: 100, tint: "bg-sky-50", text: "text-sky-600", fill: "bg-sky-500" },
    // Placeholder until escalations are stored on the server (the Escalations page is sample data).
    { label: "Escalations", icon: "🚨", value: 3, bar: 0, tint: "bg-orange-50", text: "text-orange-500", fill: "bg-orange-500" },
  ];

  const actions = [
    { label: "Attendance", icon: "✅", tint: "bg-green-50", to: "/manager/attendance" },
    { label: "Learners", icon: "🎒", tint: "bg-pink-50", to: "/manager/learners" },
    { label: "Sign-Out", icon: "🚪", tint: "bg-orange-50", to: "/manager/signout" },
    // Placeholder count, as on the Escalations card above.
    { label: "Queue", icon: "🚨", tint: "bg-red-50", to: "/manager/escalations", badge: 3 },
    { label: "Staff", icon: "👥", tint: "bg-purple-50", to: "/manager/staff" },
    { label: "Reports", icon: "📊", tint: "bg-sky-50", to: "/reports" },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
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
        {/* Welcome banner with soft decorative circles, as on the teacher home. */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <span aria-hidden="true" className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/15" />
          <span aria-hidden="true" className="absolute -bottom-12 right-20 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm opacity-90">{longDate(todayInSA())}</p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">{greeting()}, {greetName}! 👋</h1>
            {today && (
              <p className="text-sm mt-1 opacity-90">
                {today.present} of {today.activeLearners} learners present today • {today.signedOut} signed out
              </p>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}
        {!today && !error && <p className="text-sm text-gray-400 text-center py-6">Loading today's numbers...</p>}

        {today && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className={card}>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {actions.map((a) => (
            <button key={a.to} onClick={() => navigate(a.to)} className={action}>
              {a.badge && (
                <span className="absolute top-2 right-2 text-[10px] bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{a.badge}</span>
              )}
              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl ${a.tint}`} aria-hidden="true">
                {a.icon}
              </span>
              <span className="text-sm font-semibold text-gray-800 text-left leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Class Overview</h2>
            <div className={`${card} space-y-4`}>
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
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 divide-y divide-gray-100">
              {activityError && <p role="alert" className="px-4 py-3 text-sm text-red-500">{activityError}</p>}
              {!activity && !activityError && <p className="px-4 py-3 text-sm text-gray-400">Loading today's sign-outs...</p>}
              {activity?.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No sign-outs yet today.</p>}
              {activity?.map((l) => (
                <div key={l.learnerId} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{l.name} signed out</p>
                    <p className="text-xs text-gray-500">
                      {l.signedOut.collectedBy === "Walked home alone" ? "Walked home alone" : `Collected by ${l.signedOut.collectedBy}`}
                      {l.className ? ` • ${l.className}` : ""}
                    </p>
                    {l.signedOut.recordedBy && (
                      <p className="text-xs text-gray-400">Signed out by {l.signedOut.recordedBy}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{l.signedOut.timeOut}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerHome;