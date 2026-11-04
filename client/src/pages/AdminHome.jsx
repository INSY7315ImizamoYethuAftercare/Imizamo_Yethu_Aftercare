import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../services/session";
import { apiClient } from "../services/apiClient";
import { classOverviewRows } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { greeting, longDate, todayInSA } from "../utils/dates";

// Admin dashboard. Admins can't see individual learners or the register
// (POPIA), so everything here is a total from GET /reports/overview.

const percent = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%");

function AdminHome() {
  const { displayName, displayRole } = useHeader();
  const { user } = useSession();
  const navigate = useNavigate();
  const [today, setToday] = useState(null);
  const [error, setError] = useState("");
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex flex-col items-center gap-2 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
            <button onClick={() => navigate("/admin/settings")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          {today && <p className="text-sm opacity-90">{longDate(todayInSA())}</p>}
          <h1 className="text-xl font-bold mt-1">{greeting()}, {firstName}! 👋</h1>
          {today && (
            <p className="text-sm mt-1 opacity-90">
              {today.present} of {today.activeLearners} learners present today
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}
        {!today && !error && <p className="text-sm text-gray-400 text-center py-6">Loading today's numbers...</p>}

        {today && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className={card}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <p className="text-2xl font-bold text-gray-900">{today.present}</p>
                </div>
                <p className="text-xs text-gray-500">Present Today</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: percent(today.present, today.activeLearners) }}></div>
                </div>
              </div>
              <div className={card}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏠</span>
                  <p className="text-2xl font-bold text-gray-900">{today.signedOut}</p>
                </div>
                <p className="text-xs text-gray-500">Signed Out</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: percent(today.signedOut, today.present) }}></div>
                </div>
              </div>
              <div className={`${card} col-span-2 md:col-span-1`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎒</span>
                  <p className="text-2xl font-bold text-gray-900">{today.activeLearners}</p>
                </div>
                <p className="text-xs text-gray-500">Total Learners</p>
              </div>
            </div>

            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => navigate("/admin/reports")} className={action}>
                <span className="text-2xl">📊</span>
                <span className="text-sm font-semibold text-gray-800">Reports</span>
              </button>
              <button onClick={() => navigate("/admin/settings")} className={action}>
                <span className="text-2xl">⚙️</span>
                <span className="text-sm font-semibold text-gray-800">Settings</span>
              </button>
            </div>

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
