import WeeklyChart from "./WeeklyChart";
import { colourForClass } from "../pages/AddClassSheet";

function ReportsOverview({
  overviewStats,
  weeklyDays,
  weeklyChartData,
  attendanceByClass,
  devCategories,
  maxCat,
  exportOverview,
  card,
  primary,
}) {
  return (
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
  );
}

export default ReportsOverview;