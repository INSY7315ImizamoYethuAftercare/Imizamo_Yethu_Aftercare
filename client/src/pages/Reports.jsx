import ReportsTrends from "../components/ReportsTrends";
import ReportsOverview from "../components/ReportsOverview";
import ReportsTabs from "../components/ReportsTabs";
import ReportsDonor from "../components/ReportsDonor";
import ReportsBoard from "../components/ReportsBoard";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportPagePdf } from "../utils/pdf";
import { useHeader } from "./UseHeader";
import { apiClient } from "../services/apiClient";
import { boardInsight, donorInsight, hasAttendance, trendsInsight, weekInsight } from "../utils/insights";
import { STAT_COLOURS } from "../utils/statColours";
import { monthRange, monthYear, reportMonths } from "../utils/dates";
import { categoryHex } from "../utils/categories";

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
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const [months] = useState(() => reportMonths());
  const [month, setMonth] = useState(months[0].start); // first day of the chosen month
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
    const load = () => {
      const { start, end } = monthRange(month);
      return apiClient
        .get(`/reports/overview?periodStart=${start}&periodEnd=${end}`)
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
    };
    const reload = () => document.visibilityState !== "hidden" && load();

    load();
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", reload);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", reload);
    };
  }, [month]);

  const chooseMonth = (e) => {
    setMonth(e.target.value);
    // Clear the old month's numbers so they never sit under the new month's name.
    setData(null);
    setError("");
    setLoading(true);
  };

  const monthLabel = monthYear(month);
  // Null for the current month, where "this week" still means this week.
  const pastMonth = month === months[0].start ? null : monthLabel;
  const weekWords = pastMonth
    ? { now: "the final week", before: "the week before", inNow: "in the final week", Now: "Final week", Before: "Week before" }
    : { now: "this week", before: "last week", inNow: "this week", Now: "This week", Before: "Last week" };

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
    learnersAttended: 0,
  };

  const weeklyDays = data?.weeklyDays ?? [];

  const weeklyChartData = weeklyDays.map((d) => ({
    day: d.day,
    present: d.value,
    absent: d.absent,
  }));

  const attendanceByClass = data?.attendanceByClass ?? [];
  const classRows = data?.classTrends ?? [];
  const classesThisMonth = data?.classesThisMonth ?? [];
  const orgTrend = data?.orgTrend ?? [];
  const orgTrendView = data?.orgTrendView ?? "weekly";

  const maxCat = Math.max(
    1,
    ...(data?.observationsByCategory ?? []).map((c) => c.observationCount),
  );

  const devCategories = (data?.observationsByCategory ?? []).map((row) => ({
    name: row.category,
    count: row.observationCount,
    average: row.averageRating === null || row.averageRating === undefined ? null : Math.round(row.averageRating * 10) / 10,
    color: categoryHex(row.category),
  }));

  const pct = (n) => (n === null || n === undefined ? "–" : n + "%");

  const periodLabel = formatPeriodLabel(data?.periodStart, data?.periodEnd);

  const overviewStats = [
    {
      label: "Total Learners",
      value: String(t.activeLearners),
      icon: "🎒",
      ...STAT_COLOURS.learners,
    },
    {
      label: "Avg Attendance",
      value: pct(t.avgAttendance),
      icon: "📈",
      ...STAT_COLOURS.attendance,
      bar: t.avgAttendance ?? 0,
    },
    {
      label: "Observations",
      value: String(t.observations),
      icon: "📝",
      ...STAT_COLOURS.observations,
    },
    {
      label: "Classes",
      value: String(t.classes),
      icon: "🏫",
      ...STAT_COLOURS.classes,
    },
  ];

  const overviewInsight = weekInsight(data?.rates, pastMonth);
  const trendsTakeaway = trendsInsight(data?.rates, classRows, pastMonth);
  const donorTakeaway = donorInsight(t);
  const boardTakeaway = boardInsight(t);

  const donorMetrics = [
    {
      icon: "🎒",
      label: "Learners enrolled",
      value: String(t.activeLearners),
      ...STAT_COLOURS.learners,
    },
    {
      icon: "✅",
      label: "Learners who attended",
      // Marked present at least once this period; a dash until attendance has been taken.
      value: hasAttendance(t) ? String(t.learnersAttended) : "–",
      ...STAT_COLOURS.attendance,
    },
    {
      icon: "📈",
      label: "Average attendance rate",
      value: pct(t.avgAttendance),
      ...STAT_COLOURS.attendance,
    },
    {
      icon: "📝",
      label: "Development observations",
      value: String(t.observations),
      ...STAT_COLOURS.observations,
    },
    {
      icon: "🚪",
      label: "Sign outs",
      value: String(t.signOutsThisMonth),
      ...STAT_COLOURS.signOuts,
    },
  ];

  const boardKeyFigures = [
    { label: "Active learners", value: String(t.activeLearners), icon: "🎒", ...STAT_COLOURS.learners },
    { label: "Class groups", value: String(t.classes), icon: "🏫", ...STAT_COLOURS.classes },
    { label: "Active teachers", value: String(t.teachers), icon: "👩‍🏫", ...STAT_COLOURS.teachers },
    { label: "Sign outs", value: String(t.signOutsThisMonth), icon: "🚪", ...STAT_COLOURS.signOuts },
  ];

  const boardEnrollment = [
    `${t.activeLearners} active learners`,
    `${t.classes} class groups`,
    `${t.teachers} active teacher${t.teachers === 1 ? "" : "s"}`,
  ];
  const boardOperations = [
    `${t.signOutsThisMonth} sign out${t.signOutsThisMonth === 1 ? "" : "s"} ${pastMonth ? `in ${pastMonth}` : "this month"}`,
  ];
  // The total, then each category with its count and average rating (busiest first).
  const boardDevelopment = [
    `${t.observations} teacher observation${t.observations === 1 ? "" : "s"}`,
    ...[...devCategories]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map(
        (c) =>
          `${c.count} ${c.name} observation${c.count === 1 ? "" : "s"}` +
          (c.average === null ? ", no ratings yet" : `, average rating ${c.average}/10`),
      ),
  ];

  const exportPage = async (filename, title, onlySelector) => {
    setExporting(true);
    try {
      await exportPagePdf({ root: reportRef.current, filename, title, onlySelector });
    } catch (e) {
      console.error("Could not create the PDF:", e);
      setError("Couldn't create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  const exportOverview = () => exportPage("overview-report", "Overview Report");
  const exportTrends = () => exportPage("trends-report", "Attendance Trends");
  const exportTrendChart = () => exportPage("org-trend-chart", "Organisation Trend", "[data-pdf-chart]");
  const exportDonor = () => exportPage("donor-report", "Donor Impact Report");
  const exportBoard = () => exportPage("board-report", "Board Report");

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

        <div className="flex items-center justify-end gap-2 mb-4">
          <label htmlFor="report-month" className="text-sm font-medium text-gray-600">Month</label>
          <select
            id="report-month"
            value={month}
            onChange={chooseMonth}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {months.map((m) => (
              <option key={m.start} value={m.start}>{m.label}</option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 mb-4">Loading report data…</p>
        )}
        {error && (
          <p className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Covers the page while the report is briefly resized to be captured. */}
        {exporting && (
          <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-white text-sm font-semibold text-gray-600">
            Preparing your PDF…
          </div>
        )}

        <div ref={reportRef}>
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
            pastMonth={pastMonth}
            weekWords={weekWords}
            exportOverview={exportOverview}
            card={card}
            primary={primary}
          />
        )}

        {activeTab === "Trends" && (
          <ReportsTrends
            orgTrend={orgTrend}
            orgTrendView={orgTrendView}
            classRows={classRows}
            insight={trendsTakeaway}
            pastMonth={pastMonth}
            weekWords={weekWords}
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
            classesThisMonth={classesThisMonth}
            monthLabel={monthLabel}
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
            classesThisMonth={classesThisMonth}
            monthLabel={monthLabel}
            boardEnrollment={boardEnrollment}
            boardOperations={boardOperations}
            boardDevelopment={boardDevelopment}
            periodLabel={periodLabel}
            insight={boardTakeaway}
            exportBoard={exportBoard}
            card={card}
            primary={primary}
          />
        )}
        </div>
      </div>
    </div>
  );
}

export default Reports;