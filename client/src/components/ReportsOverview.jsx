import WeeklyChart from "./WeeklyChart";
import ReportsBanner from "./ReportsBanner";
import { colourForClass } from "../pages/AddClassSheet";
import { changeLabel, pointsChange } from "../utils/insights";

// Present against absent as a ring, with the overall rate in the middle.
function AttendanceDonut({ present, absent, rate }) {
  const total = present + absent;
  const presentShare = total > 0 ? (present / total) * 100 : 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" role="img" aria-label={total > 0 ? `${Math.round(presentShare)}% present` : "No attendance recorded"}>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#EF4444" strokeWidth="4" />
          {total > 0 && (
            <circle
              cx="18" cy="18" r="15.9155" fill="none" stroke="#22C55E" strokeWidth="4"
              strokeDasharray={`${presentShare} ${100 - presentShare}`} strokeLinecap="butt"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{rate === null ? "–" : `${rate}%`}</span>
          <span className="text-[10px] text-gray-400">attendance</span>
        </div>
      </div>
      <div className="space-y-2 min-w-0 text-sm">
        <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />Present <span className="font-bold text-gray-900">{present}</span></p>
        <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />Absent <span className="font-bold text-gray-900">{absent}</span></p>
        <p className="text-xs text-gray-400">{total} attendance record{total === 1 ? "" : "s"}</p>
      </div>
    </div>
  );
}

// ▲ 3 / ▼ 2 against last week, coloured by direction.
function ChangeChip({ diff }) {
  if (diff === null) return null;
  const tone = diff > 0 ? "bg-green-50 text-green-600" : diff < 0 ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500";
  return <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${tone}`}>{changeLabel(diff)}</span>;
}

function ReportsOverview({
  overviewStats,
  weeklyDays,
  weeklyChartData,
  attendanceByClass,
  classRows,
  devCategories,
  maxCat,
  totals,
  periodLabel,
  insight,
  exportOverview,
  card,
  primary,
}) {
  const changeFor = (name) => {
    const row = classRows.find((c) => c.name === name);
    return row ? pointsChange(row.thisWeek, row.lastWeek) : null;
  };

  return (
    <div className="space-y-4 w-full pb-8">
      <ReportsBanner icon="📊" title="Overview" subtitle={periodLabel} insight={insight} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {overviewStats.map((row) => (
          <div key={row.label} className={`${card} flex flex-col min-w-0`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${row.tint}`} aria-hidden="true">
              {row.icon}
            </span>
            <p className={`text-2xl font-bold mt-3 ${row.color}`}>{row.value}</p>
            <p className="text-xs text-gray-500 mt-1">{row.label}</p>
            {row.bar !== undefined && (
              <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${row.fill}`} style={{ width: `${row.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>✅</span> Present vs Absent
        </h3>
        {totals.presentRecords + totals.absentRecords === 0 ? (
          <p className="text-xs text-gray-400">No attendance recorded for this period yet.</p>
        ) : (
          <AttendanceDonut present={totals.presentRecords} absent={totals.absentRecords} rate={totals.avgAttendance} />
        )}
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
            <div key={d.label} className="flex-1 text-center min-w-0 rounded-xl bg-gray-50 py-2" data-day={d.label}>
              {d.recorded ? (
                <>
                  <p className="text-lg font-bold text-green-600" aria-label={`${d.value} present`}>{d.value}</p>
                  <p className="text-xs font-bold text-red-500" aria-label={`${d.absent} absent`}>{d.absent}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-300">–</p>
                  <p className="text-xs text-gray-300">–</p>
                </>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{d.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Green is present, red is absent. A dash means no register was taken that day.
        </p>
        <WeeklyChart data={weeklyChartData} />
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏫</span> Attendance by Class
        </h3>
        <div className="space-y-4">
          {attendanceByClass.length === 0 && (
            <p className="text-xs text-gray-400">No class attendance data for this period.</p>
          )}
          {attendanceByClass.map((c) => (
            <div key={c.name}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800 truncate inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colourForClass(c.name, c.colour) }} />
                  {c.name}
                </span>
                <span className="text-xs text-gray-500 shrink-0 inline-flex items-center gap-2">
                  <ChangeChip diff={changeFor(c.name)} />
                  <span>
                    {c.rate === null ? "No data yet" : `${c.rate}%`} · {c.learners} learner{c.learners === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${c.rate ?? 0}%`,
                    backgroundColor: colourForClass(c.name, c.colour),
                  }}
                />
              </div>
            </div>
          ))}
          {attendanceByClass.length > 0 && <p className="text-[11px] text-gray-400">Change is this week against last week, in percentage points.</p>}
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
  );
}

export default ReportsOverview;
