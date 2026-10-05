import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WeeklyChart from "../components/WeeklyChart";
import TrendChart from "../components/TrendChart";
import { exportChart } from "../utils/charts";
import { generatePDF } from "../utils/pdf";
import { colourForClass } from "./AddClassSheet";
import { useHeader } from "./UseHeader";
import { apiClient } from "../services/apiClient";

const DAY_COLOURS = ["#FB923C", "#38BDF8", "#4ADE80", "#F472B6", "#A78BFA"];

const CATEGORY_COLOURS = {
  Academic: "#38BDF8",
  Social: "#2DD4BF",
  Wellbeing: "#FB923C",
  Creative: "#F472B6",
};

function formatPeriodLabel(start, end) {
  if (!start || !end) return "Current period";
  try {
    const opts = { month: "short", year: "numeric", day: "numeric" };
    const s = new Date(`${start}T00:00:00`).toLocaleDateString(undefined, opts);
    const e = new Date(`${end}T00:00:00`).toLocaleDateString(undefined, opts);
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function Reports({ role = "Manager" }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const tabs = [
    { id: "Overview", icon: "📊" },
    { id: "Trends", icon: "📈" },
    { id: "Donor Report", icon: "💼" },
    { id: "Board Report", icon: "📋" },
  ];
  const { displayName, displayRole } = useHeader();
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const primary =
    "w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition flex items-center justify-center gap-2";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiClient
      .get("/reports/overview")
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load report data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const t = data?.totals ?? {
    activeLearners: 0,
    classes: 0,
    teachers: 0,
    observations: 0,
    avgAttendance: 0,
    signOutsThisMonth: 0,
    daysDelivered: 0,
    uniqueLearnersServed: 0,
  };

  const weeklyDays = (data?.weeklyDays ?? []).map((d, i) => ({
    ...d,
    color: DAY_COLOURS[i % DAY_COLOURS.length],
  }));

  const weeklyChartData = weeklyDays.map((d) => ({
    day: d.day,
    present: d.value,
  }));

  const attendanceByClass = data?.attendanceByClass ?? [];
  const classRows = data?.classTrends ?? [];
  const orgTrend = data?.orgTrend ?? [];

  const maxCat = Math.max(
    1,
    ...(data?.observationsByCategory ?? []).map((c) => c.observationCount),
  );

  const devCategories = (data?.observationsByCategory ?? []).map((row) => ({
    name: row.category,
    count: row.observationCount,
    color: CATEGORY_COLOURS[row.category] ?? "#94A3B8",
  }));

  const pct = (n) => (n === null || n === undefined ? "–" : n + "%");

  const periodLabel = formatPeriodLabel(data?.periodStart, data?.periodEnd);

  const overviewStats = [
    {
      label: "Total Learners",
      value: String(t.activeLearners),
      icon: "🎒",
      color: "text-orange-500",
    },
    {
      label: "Avg Attendance",
      value: `${t.avgAttendance}%`,
      icon: "📈",
      color: "text-green-500",
    },
    {
      label: "Observations",
      value: String(t.observations),
      icon: "📝",
      color: "text-sky-500",
    },
    {
      label: "Classes",
      value: String(t.classes),
      icon: "🏫",
      color: "text-pink-500",
    },
  ];

  const donorMetrics = [
    {
      icon: "🎒",
      label: "Learners served this period",
      value: String(t.uniqueLearnersServed || t.activeLearners),
    },
    {
      icon: "📈",
      label: "Average attendance rate",
      value: `${t.avgAttendance}%`,
    },
    {
      icon: "📝",
      label: "Development observations",
      value: String(t.observations),
    },
    {
      icon: "🏠",
      label: "Safe collections this month",
      value: String(t.signOutsThisMonth),
    },
    {
      icon: "📅",
      label: "Days of aftercare delivered",
      value: String(t.daysDelivered),
    },
  ];

  const boardEnrolment = [
    `${t.activeLearners} active learners`,
    `${t.classes} class groups`,
    `${t.teachers} qualified teachers`,
  ];
  const boardOperations = [
    `Digital attendance recorded on ${t.daysDelivered} day${t.daysDelivered === 1 ? "" : "s"}`,
    "Digital sign-out system operational",
    `${t.signOutsThisMonth} safe collection${t.signOutsThisMonth === 1 ? "" : "s"} this month`,
  ];
  const boardWellbeing = [
    `${t.observations} teacher observation${t.observations === 1 ? "" : "s"}`,
    "Parent communication: ongoing",
  ];

  const exportOverview = () =>
    generatePDF({
      filename: "overview-report",
      title: "Overview Report",
      period: periodLabel,
      rows: overviewStats.map((r) => ({ label: r.label, value: r.value })),
    });

  const exportTrends = () =>
    generatePDF({
      filename: "trends-report",
      title: "Attendance Trends",
      period: "This week vs last week",
      rows: classRows.map((c) => ({
        label: c.name,
        value:
          c.thisWeek === null && c.lastWeek === null
            ? "No data yet"
            : `${pct(c.thisWeek)} this week / ${pct(c.lastWeek)} last week`,
      })),
    });

  const exportDonor = () =>
    generatePDF({
      filename: "donor-report",
      title: "Donor Impact Report",
      period: periodLabel,
      rows: donorMetrics.map((r) => ({ label: r.label, value: r.value })),
    });

  const exportBoard = () =>
    generatePDF({
      filename: "board-report",
      title: "Board Report",
      period: periodLabel,
      rows: [
        ...boardEnrolment.map((text) => ({ label: "Enrolment", value: text })),
        ...boardOperations.map((text) => ({ label: "Operations", value: text })),
        ...boardWellbeing.map((text) => ({ label: "Wellbeing", value: text })),
      ],
    });

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
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
            <button onClick={comingSoon} className={iconBtn}>
              🔔
            </button>
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* pb-36 keeps content clear of the floating bottom nav */}
      <div className="flex-1 px-4 pt-5 pb-36 max-w-5xl mx-auto w-full min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Reports <span>📊</span>
          </h1>
          <p className="text-sm text-gray-500">Analytics & PDF exports</p>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[72px] py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.97] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange-400 text-white shadow-md"
                  : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
              }`}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.id}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-sm text-gray-500 mb-4">Loading report data…</p>
        )}
        {error && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <div className="space-y-4 w-full pb-8">
            <div className="grid grid-cols-2 gap-3">
              {overviewStats.map((row) => (
                <div key={row.label} className={`${card} flex flex-col gap-1 min-w-0`}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{row.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${row.color}`}>{row.value}</p>
                  <p className="text-xs text-gray-500">{row.label}</p>
                </div>
              ))}
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📅</span> Weekly Attendance
              </h3>
              <div className="flex justify-between gap-2 mb-4">
                {weeklyDays.length === 0 && (
                  <p className="text-xs text-gray-400">No attendance recorded this week yet.</p>
                )}
                {weeklyDays.map((d) => (
                  <div key={d.label} className="flex-1 text-center min-w-0">
                    <p className="text-lg font-bold" style={{ color: d.color }}>
                      {d.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{d.label}</p>
                  </div>
                ))}
              </div>
              <WeeklyChart data={weeklyChartData} />
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏫</span> Attendance by Class
              </h3>
              <div className="space-y-3">
                {attendanceByClass.length === 0 && (
                  <p className="text-xs text-gray-400">No class attendance data for this period.</p>
                )}
                {attendanceByClass.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800 truncate">{c.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {c.rate}% · {c.learners} learner{c.learners === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.rate}%`,
                          backgroundColor: colourForClass(c.name, c.colour),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🧩</span> Development Categories
              </h3>
              <div className="space-y-3">
                {devCategories.length === 0 && (
                  <p className="text-xs text-gray-400">No observations recorded for this period.</p>
                )}
                {devCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-20 sm:w-24 shrink-0 truncate">{cat.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.count / maxCat) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right shrink-0">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={exportOverview} className={primary}>
              📄 Export as PDF
            </button>
          </div>
        )}

        {/* ── Trends ── */}
        {activeTab === "Trends" && (
          <div className="space-y-5 w-full pb-8">
            <div className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900">Organisation trend</h3>
                <button
                  onClick={() => exportChart("org-trend")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
                >
                  Export chart
                </button>
              </div>
              <TrendChart data={orgTrend} />
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Cross-class attendance</h3>
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-sm min-w-[280px]">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 font-medium">Class</th>
                      <th className="py-2 font-medium">This week</th>
                      <th className="py-2 font-medium">Last week</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-3 text-xs text-gray-400">
                          No class trend data yet.
                        </td>
                      </tr>
                    )}
                    {classRows.map((cls) => (
                      <tr key={cls.name} className="border-b border-gray-50">
                        <td className="py-2 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: colourForClass(cls.name, cls.colour) }}
                            />
                            {cls.name}
                          </span>
                        </td>
                        <td className="py-2">{pct(cls.thisWeek)}</td>
                        <td className="py-2">{pct(cls.lastWeek)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={exportTrends} className={primary}>
              📄 Export as PDF
            </button>
          </div>
        )}

        {/* ── Donor Report ── */}
        {activeTab === "Donor Report" && (
          <div className="space-y-4 w-full pb-8">
            <div className="bg-purple-50 rounded-2xl p-4 sm:p-6 text-center shadow-lg border border-purple-100">
              <div className="text-2xl sm:text-3xl mb-2">💼</div>
              <h2 className="font-bold text-orange-500 text-base sm:text-lg">Donor Impact Report</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{periodLabel}</p>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
              <div className="space-y-1">
                {donorMetrics.map((m) => (
                  <div
                    key={m.label}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{m.icon}</span>
                      <span className="text-sm text-gray-600 break-words">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold text-orange-500 sm:shrink-0 sm:text-right pl-7 sm:pl-0">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                During this period, the Imizamo Yethu Learning Hub provided aftercare services
                to {t.uniqueLearnersServed || t.activeLearners} registered learner
                {(t.uniqueLearnersServed || t.activeLearners) === 1 ? "" : "s"} across{" "}
                {t.classes} class group{t.classes === 1 ? "" : "s"}. The programme maintained a{" "}
                {t.avgAttendance}% average attendance rate
                {t.observations > 0
                  ? `, with ${t.observations} development observation${t.observations === 1 ? "" : "s"} recorded`
                  : ""}
                .
              </p>
            </div>

            <button onClick={exportDonor} className={primary}>
              📄 Export as PDF
            </button>
          </div>
        )}

        {/* ── Board Report ── */}
        {activeTab === "Board Report" && (
          <div className="space-y-4 w-full pb-8">
            <div className="bg-orange-50 rounded-2xl p-4 sm:p-6 text-center shadow-lg border border-orange-100">
              <div className="text-2xl sm:text-3xl mb-2">📋</div>
              <h2 className="font-bold text-orange-500 text-base sm:text-lg">Board Report</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{periodLabel}</p>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Enrolment</h3>
              <ul className="space-y-2">
                {boardEnrolment.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-400 mt-0.5 shrink-0">●</span>
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Operations</h3>
              <ul className="space-y-2">
                {boardOperations.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-400 mt-0.5 shrink-0">●</span>
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Wellbeing</h3>
              <ul className="space-y-2">
                {boardWellbeing.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-400 mt-0.5 shrink-0">●</span>
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={exportBoard} className={primary}>
              📄 Export as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
