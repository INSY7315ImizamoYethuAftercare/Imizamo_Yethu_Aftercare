import TrendChart from "./TrendChart";
import ReportsBanner from "./ReportsBanner";
import { colourForClass } from "../pages/AddClassSheet";
import { changeLabel, pointsChange } from "../utils/insights";

function ReportsTrends({
  orgTrend,
  classRows,
  insight,
  exportTrends,
  exportChart,
  pct,
  card,
  primary,
}) {
  return (
    <div className="space-y-5 w-full pb-8">
      <ReportsBanner icon="📈" title="Trends" subtitle="This week against last week" insight={insight} />

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900">Organisation trend</h3>
          <button
            onClick={exportChart}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
          >
            Export chart as PDF
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
                <th className="py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {classRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-xs text-gray-400">
                    No class trend data yet.
                  </td>
                </tr>
              )}
              {classRows.map((cls) => {
                const diff = pointsChange(cls.thisWeek, cls.lastWeek);
                const tone = diff === null ? "text-gray-400" : diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-500";
                return (
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
                    <td className={`py-2 font-semibold ${tone}`}>{changeLabel(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={exportTrends} className={primary}>
        📄 Export as PDF
      </button>
    </div>
  );
}

export default ReportsTrends;
