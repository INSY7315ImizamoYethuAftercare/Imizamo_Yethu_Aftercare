import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * @param {{ data?: Array<{ label: string, rate: number|null }> }} props
 */
function TrendChart({ data }) {
  const chartData = data ?? [];

  const rates = chartData.map((d) => d.rate).filter((n) => typeof n === "number");

  // No attendance recorded in any window: say so instead of drawing a flat line.
  if (rates.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-gray-400">No attendance recorded for this period yet.</p>
      </div>
    );
  }

  // Whole tens up to 100, so the axis labels are round percentages.
  const domainMin = Math.floor(Math.min(...rates, 80) / 10) * 10;
  const step = 100 - domainMin > 50 ? 20 : 10;
  const ticks = [];
  for (let tick = 100; tick >= domainMin; tick -= step) ticks.unshift(tick);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          {/* The padding stops the first and last dots being cut off. */}
          <XAxis dataKey="label" tick={{ fontSize: 11 }} padding={{ left: 24, right: 24 }} />
          <YAxis domain={[ticks[0], 100]} ticks={ticks} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
          <Line type="monotone" dataKey="rate" stroke="#FB923C" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;