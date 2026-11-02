import ReportsTrends from "../components/ReportsTrends";
import ReportsOverview from "../components/ReportsOverview";
import ReportsTabs from "../components/ReportsTabs";
import ReportsDonor from "../components/ReportsDonor";
import ReportsBoard from "../components/ReportsBoard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateChartPDF, generatePDF } from "../utils/pdf";
import { useHeader } from "./UseHeader";
import { apiClient } from "../services/apiClient";
import { boardInsight, donorInsight, trendsInsight, weekInsight } from "../utils/insights";
import { colourForClass } from "./AddClassSheet";

// Colours are the same Tailwind shades the rest of the app uses. The weekly bars
// are present counts, so they are green like "Present" on the home screens.
const PRESENT_GREEN = "#22C55E";
const ABSENT_RED = "#EF4444";

const CATEGORY_COLOURS = {
  Academic: "#0EA5E9",
  Social: "#A855F7",
  Wellbeing: "#F97316",
  Creative: "#EC4899",
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

  // Loads when the page opens, and again whenever the manager comes back to
  // the tab, so attendance a teacher marked in the meantime shows up without a
  // manual refresh. Only the first load shows "Loading"; later ones swap the
  // numbers in quietly.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient
        .get("/reports/overview")
        .then((payload) => {
          if (cancelled) return;
          setData(payload);
          setError("");
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Could not load report data.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    const reload = () => document.visibilityState !== "hidden" && load();

    load();
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", reload);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", reload);
    };
  }, []);

  const t = data?.totals ?? {
    activeLearners: 0,
    classes: 0,
    teachers: 0,
    observations: 0,
    avgAttendance: null,
    signOutsThisMonth: 0,
    daysDelivered: 0,
    uniqueLearnersServed: 0,
    presentRecords: 0,
    absentRecords: 0,
  };

  const weeklyDays = (data?.weeklyDays ?? []).map((d) => ({
    ...d,
    color: PRESENT_GREEN,
  }));

  const weeklyChartData = weeklyDays.map((d) => ({
    day: d.day,
    present: d.value,
    absent: d.absent,
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
  const NO_DATA = "No data yet";

  const periodLabel = formatPeriodLabel(data?.periodStart, data?.periodEnd);

  const overviewStats = [
    {
      label: "Total Learners",
      value: String(t.activeLearners),
      icon: "🎒",
      color: "text-orange-500",
      tint: "bg-orange-50",
    },
    {
      label: "Avg Attendance",
      value: pct(t.avgAttendance),
      icon: "📈",
      color: "text-green-600",
      tint: "bg-green-50",
      bar: t.avgAttendance ?? 0,
      fill: "bg-green-500",
    },
    {
      label: "Observations",
      value: String(t.observations),
      icon: "📝",
      color: "text-sky-600",
      tint: "bg-sky-50",
    },
    {
      label: "Classes",
      value: String(t.classes),
      icon: "🏫",
      color: "text-pink-500",
      tint: "bg-pink-50",
    },
  ];

  const overviewInsight = weekInsight(data?.rates);
  const trendsTakeaway = trendsInsight(data?.rates, classRows);
  const donorTakeaway = donorInsight(t);
  const boardTakeaway = boardInsight(t);

  const donorMetrics = [
    {
      icon: "🎒",
      label: "Learners served this period",
      value: String(t.uniqueLearnersServed || t.activeLearners),
    },
    {
      icon: "📈",
      label: "Average attendance rate",
      value: pct(t.avgAttendance),
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

  const boardKeyFigures = [
    { label: "Active learners", value: String(t.activeLearners), icon: "🎒", tint: "bg-pink-50", text: "text-pink-500" },
    { label: "Class groups", value: String(t.classes), icon: "🏫", tint: "bg-sky-50", text: "text-sky-600" },
    { label: "Active teachers", value: String(t.teachers), icon: "👩‍🏫", tint: "bg-purple-50", text: "text-purple-600" },
    { label: "Safe collections this month", value: String(t.signOutsThisMonth), icon: "🚪", tint: "bg-orange-50", text: "text-orange-500" },
  ];

  const boardEnrolment = [
    `${t.activeLearners} active learners`,
    `${t.classes} class groups`,
    `${t.teachers} active teacher${t.teachers === 1 ? "" : "s"}`,
  ];
  const boardOperations = [
    `Digital attendance recorded on ${t.daysDelivered} day${t.daysDelivered === 1 ? "" : "s"}`,
    `${t.signOutsThisMonth} safe collection${t.signOutsThisMonth === 1 ? "" : "s"} this month`,
  ];
  const boardWellbeing = [
    `${t.observations} teacher observation${t.observations === 1 ? "" : "s"}`,
  ];

  const exportOverview = () =>
    generatePDF({
      filename: "overview-report",
      title: "Overview Report",
      period: periodLabel,
      summary: overviewInsight.text,
      rows: overviewStats.map((r) => ({ label: r.label, value: r.value })),
      charts: [
        {
          type: "split",
          heading: "Present vs absent",
          parts: [
            { label: "Present", value: t.presentRecords, color: PRESENT_GREEN },
            { label: "Absent", value: t.absentRecords, color: ABSENT_RED },
          ],
        },
        {
          type: "bars",
          heading: "Present and absent each day this week",
          items: weeklyDays.map((d) => ({
            label: d.label,
            parts: d.recorded
              ? [
                  { value: d.value, color: PRESENT_GREEN },
                  { value: d.absent, color: ABSENT_RED },
                ]
              : null,
            display: d.recorded ? `${d.value} present, ${d.absent} absent` : undefined,
          })),
        },
        {
          type: "bars",
          heading: "Attendance by class",
          max: 100,
          items: attendanceByClass.map((c) => ({
            label: c.name,
            value: c.rate,
            display: c.rate === null ? undefined : `${c.rate}%`,
            color: colourForClass(c.name, c.colour),
          })),
        },
        {
          type: "bars",
          heading: "Observations by development category",
          items: devCategories.map((c) => ({ label: c.name, value: c.count, color: c.color })),
        },
      ],
    });

  const exportTrends = () =>
    generatePDF({
      filename: "trends-report",
      title: "Attendance Trends",
      period: "This week vs last week",
      summary: trendsTakeaway.text,
      charts: [
        {
          type: "line",
          heading: "Organisation attendance across the period",
          points: orgTrend.map((w) => ({ label: w.week, value: w.rate })),
        },
        {
          type: "bars",
          heading: "Attendance by class this week",
          max: 100,
          items: classRows.map((c) => ({
            label: c.name,
            value: c.thisWeek,
            display: c.thisWeek === null ? undefined : `${c.thisWeek}%`,
            color: colourForClass(c.name, c.colour),
          })),
        },
      ],
      rows: classRows.map((c) => ({
        label: c.name,
        value:
          c.thisWeek === null && c.lastWeek === null
            ? NO_DATA
            : `${pct(c.thisWeek)} this week / ${pct(c.lastWeek)} last week`,
      })),
    });

  const exportTrendChart = () =>
    generateChartPDF({
      filename: "org-trend-chart",
      title: "Organisation Trend",
      period: periodLabel,
      heading: "Attendance rate across the period",
      points: orgTrend.map((w) => ({ label: w.week, value: w.rate })),
    });

  const exportDonor = () =>
    generatePDF({
      filename: "donor-report",
      title: "Donor Impact Report",
      period: periodLabel,
      summary: donorTakeaway.text,
      rows: donorMetrics.map((r) => ({ label: r.label, value: r.value })),
    });

  const exportBoard = () =>
    generatePDF({
      filename: "board-report",
      title: "Board Report",
      period: periodLabel,
      summary: boardTakeaway.text,
      rows: [
        ...boardEnrolment.map((text) => ({ label: "Enrolment", value: text })),
        ...boardOperations.map((text) => ({ label: "Operations", value: text })),
        ...boardWellbeing.map((text) => ({ label: "Wellbeing", value: text })),
      ],
    });

  return (
    <div className="min-h-screen bg-cream flex flex-col">
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

        <ReportsTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {loading && (
          <p className="text-sm text-gray-500 mb-4">Loading report data…</p>
        )}
        {error && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {activeTab === "Overview" && (
          <ReportsOverview
            overviewStats={overviewStats}
            weeklyDays={weeklyDays}
            weeklyChartData={weeklyChartData}
            attendanceByClass={attendanceByClass}
            classRows={classRows}
            devCategories={devCategories}
            maxCat={maxCat}
            totals={t}
            periodLabel={periodLabel}
            insight={overviewInsight}
            exportOverview={exportOverview}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Trends" && (
          <ReportsTrends
            orgTrend={orgTrend}
            classRows={classRows}
            insight={trendsTakeaway}
            exportTrends={exportTrends}
            exportChart={exportTrendChart}
            pct={pct}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Donor Report" && (
          <ReportsDonor
            donorMetrics={donorMetrics}
            periodLabel={periodLabel}
            insight={donorTakeaway}
            t={t}
            exportDonor={exportDonor}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Board Report" && (
          <ReportsBoard
            boardKeyFigures={boardKeyFigures}
            boardEnrolment={boardEnrolment}
            boardOperations={boardOperations}
            boardWellbeing={boardWellbeing}
            periodLabel={periodLabel}
            insight={boardTakeaway}
            exportBoard={exportBoard}
            card={card}
            primary={primary}
          />
        )}
      </div>
    </div>
  );
}

export default Reports;