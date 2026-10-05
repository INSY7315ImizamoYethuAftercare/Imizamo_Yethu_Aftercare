import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * @param {{ data?: Array<{ day: string, present: number }> }} props
 */
function WeeklyChart({ data }) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { day: "Mon", present: 0 },
          { day: "Tue", present: 0 },
          { day: "Wed", present: 0 },
          { day: "Thu", present: 0 },
          { day: "Fri", present: 0 },
        ];

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="present" fill="#FB923C" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeeklyChart;