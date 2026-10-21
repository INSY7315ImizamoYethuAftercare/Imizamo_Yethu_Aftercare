import ReportsTrends from "../components/ReportsTrends";
import ReportsOverview from "../components/ReportsOverview";
import ReportsTabs from "../components/ReportsTabs";
import ReportsDonor from "../components/ReportsDonor";
import ReportsBoard from "../components/ReportsBoard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generatePDF } from "../utils/pdf";
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
            devCategories={devCategories}
            maxCat={maxCat}
            exportOverview={exportOverview}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Trends" && (
          <ReportsTrends
            orgTrend={orgTrend}
            classRows={classRows}
            exportTrends={exportTrends}
            pct={pct}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Donor Report" && (
          <ReportsDonor
            donorMetrics={donorMetrics}
            periodLabel={periodLabel}
            t={t}
            exportDonor={exportDonor}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Board Report" && (
          <ReportsBoard
            boardEnrolment={boardEnrolment}
            boardOperations={boardOperations}
            boardWellbeing={boardWellbeing}
            periodLabel={periodLabel}
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