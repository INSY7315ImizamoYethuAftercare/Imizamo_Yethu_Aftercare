import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WeeklyChart from "../components/WeeklyChart";
import TrendChart from "../components/TrendChart";
import { exportChart } from "../utils/charts";
import { generatePDF } from "../utils/pdf";
import { colourForClass } from "./AddClassSheet";
import { useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";

const WEEKLY_DAYS = [
  { label: "Mon 21", value: 5, color: "#FB923C" },
  { label: "Tue 22", value: 5, color: "#38BDF8" },
  { label: "Wed 23", value: 5, color: "#4ADE80" },
  { label: "Thu 24", value: 4, color: "#F472B6" },
  { label: "Fri 25", value: 4, color: "#A78BFA" },
];

const ATTENDANCE_BY_CLASS = [
  { name: "Yellow", rate: 97, learners: 2 },
  { name: "Green", rate: 90, learners: 2 },
  { name: "Blue", rate: 97, learners: 1 },
  { name: "Red", rate: 85, learners: 1 },
];

const DEV_CATEGORIES = [
  { name: "Academic", count: 3, color: "#38BDF8" },
  { name: "Social", count: 2, color: "#2DD4BF" },
  { name: "Wellbeing", count: 1, color: "#FB923C" },
  { name: "Creative", count: 1, color: "#F472B6" },
];

function Reports({ role = "Manager" }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const navigate = useNavigate();
  const classList = useClasses();
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

  const sampleWeekly = {
    Yellow: { thisWeek: 97, lastWeek: 94 },
    Green: { thisWeek: 90, lastWeek: 88 },
    Red: { thisWeek: 85, lastWeek: 90 },
    Blue: { thisWeek: 97, lastWeek: 80 },
  };
  const classRows = classList.map((c) => ({
    name: c.name,
    ...(sampleWeekly[c.name] ?? { thisWeek: null, lastWeek: null }),
  }));
  const pct = (n) => (n === null ? "–" : n + "%");

  const overviewStats = [
    { label: "Total Learners", value: "6", icon: "🎒", color: "text-orange-500" },
    { label: "Avg Attendance", value: "92%", icon: "📈", color: "text-green-500" },
    { label: "Observations", value: "8", icon: "📝", color: "text-sky-500" },
    { label: "Classes", value: String(classList.length || 4), icon: "🏫", color: "text-pink-500" },
  ];

  const donorMetrics = [
    { icon: "🎒", label: "Learners served this quarter", value: "6" },
    { icon: "📈", label: "Average attendance rate", value: "92%" },
    { icon: "📝", label: "Development observations", value: "8" },
    { icon: "🏠", label: "Safe collections this month", value: "48" },
    { icon: "📅", label: "Days of aftercare delivered", value: "22" },
  ];

  const boardEnrolment = [
    "6 active learners",
    "4 class groups",
    "4 qualified teachers",
    "1 new enrolment (July)",
  ];
  const boardOperations = [
    "Digital attendance: 100% compliance",
    "Digital sign-out system operational",
    "Parent portal launched",
    "0 safety incidents",
  ];
  const boardWellbeing = [
    "8 teacher observations",
    "Peer mentor programme active",
    "2 learners receiving additional support",
    "Parent communication: ongoing",
  ];

  const exportOverview = () =>
    generatePDF({
      filename: "overview-report",
      title: "Overview Report",
      period: "July 2025",
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
          c.thisWeek === null
            ? "No data yet"
            : c.thisWeek + "% this week / " + c.lastWeek + "% last week",
      })),
    });

  const exportDonor = () =>
    generatePDF({
      filename: "donor-report",
      title: "Donor Impact Report",
      period: "Q3 2025 · July",
      rows: donorMetrics.map((r) => ({ label: r.label, value: r.value })),
    });

  const exportBoard = () =>
    generatePDF({
      filename: "board-report",
      title: "Board Report",
      period: "July 2025 · Monthly Overview",
      rows: [
        ...boardEnrolment.map((t) => ({ label: "Enrolment", value: t })),
        ...boardOperations.map((t) => ({ label: "Operations", value: t })),
        ...boardWellbeing.map((t) => ({ label: "Wellbeing", value: t })),
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
            <button onClick={comingSoon} className={iconBtn}>🔔</button>
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
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
              className={`flex-1 min-w-[72px] py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.97] flex items-center justify-center gap-1 ${
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

        {/* ── Overview (Figma) ── */}
        {activeTab === "Overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {overviewStats.map((row) => (
                <div key={row.label} className={`${card} flex flex-col gap-1`}>
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
                {WEEKLY_DAYS.map((d) => (
                  <div key={d.label} className="flex-1 text-center">
                    <p className="text-lg font-bold" style={{ color: d.color }}>
                      {d.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{d.label}</p>
                  </div>
                ))}
              </div>
              <WeeklyChart />
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏫</span> Attendance by Class
              </h3>
              <div className="space-y-3">
                {ATTENDANCE_BY_CLASS.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-500">
                        {c.rate}% · {c.learners} learner{c.learners === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.rate}%`,
                          backgroundColor: colourForClass(c.name),
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
                {DEV_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-24 shrink-0">{cat.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.count / 3) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right">
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
          <div className="space-y-5">
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Organisation trend</h3>
                <button
                  onClick={() => exportChart("org-trend")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
                >
                  Export chart
                </button>
              </div>
              <TrendChart />
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Cross-class attendance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 font-medium">Class</th>
                      <th className="py-2 font-medium">This week</th>
                      <th className="py-2 font-medium">Last week</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.map((cls) => (
                      <tr key={cls.name} className="border-b border-gray-50">
                        <td className="py-2 font-medium flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: colourForClass(cls.name) }}
                          />
                          {cls.name}
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

        {/* ── Donor Report (Figma) ── */}
        {activeTab === "Donor Report" && (
          <div className="space-y-4 max-w-3xl">
            <div className="bg-purple-50 rounded-2xl p-6 text-center shadow-lg border border-purple-100">
              <div className="text-3xl mb-2">💼</div>
              <h2 className="font-bold text-orange-500 text-lg">Donor Impact Report</h2>
              <p className="text-sm text-gray-500 mt-1">Q3 2025 · July</p>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
              <div className="space-y-3">
                {donorMetrics.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between gap-3 py-1 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{m.icon}</span>
                      <span className="text-sm text-gray-600">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold text-orange-500 shrink-0">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                During Q3 2025, the Imizamo Yethu Learning Hub successfully provided
                aftercare services to 6 registered learners across 4 class groups. The
                programme maintained a strong 92% average attendance rate, demonstrating
                consistent learner engagement and parental trust in our services.
              </p>
            </div>

            <button onClick={exportDonor} className={primary}>
              📄 Export as PDF
            </button>
          </div>
        )}

        {/* ── Board Report (Figma) ── */}
        {activeTab === "Board Report" && (
          <div className="space-y-4 max-w-3xl">
            <div className="bg-orange-50 rounded-2xl p-6 text-center shadow-lg border border-orange-100">
              <div className="text-3xl mb-2">📋</div>
              <h2 className="font-bold text-orange-500 text-lg">Board Report</h2>
              <p className="text-sm text-gray-500 mt-1">July 2025 · Monthly Overview</p>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Enrolment</h3>
              <ul className="space-y-2">
                {boardEnrolment.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Operations</h3>
              <ul className="space-y-2">
                {boardOperations.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Wellbeing</h3>
              <ul className="space-y-2">
                {boardWellbeing.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    {item}
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
