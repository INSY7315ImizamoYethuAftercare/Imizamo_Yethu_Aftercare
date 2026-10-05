import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * @param {{ data?: Array<{ week: string, rate: number }> }} props
 */
function TrendChart({ data }) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { week: "W1", rate: 0 },
          { week: "W2", rate: 0 },
          { week: "W3", rate: 0 },
          { week: "W4", rate: 0 },
        ];

  const rates = chartData.map((d) => d.rate).filter((n) => typeof n === "number");
  const min = rates.length ? Math.min(...rates, 80) : 0;
  const max = rates.length ? Math.max(...rates, 100) : 100;
  const domainMin = Math.max(0, Math.floor(min / 5) * 5 - 5);
  const domainMax = Math.min(100, Math.ceil(max / 5) * 5 + 5);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="rate" stroke="#FB923C" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;