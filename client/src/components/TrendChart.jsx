import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { week: "W1", rate: 88 },
  { week: "W2", rate: 90 },
  { week: "W3", rate: 91 },
  { week: "W4", rate: 92 },
];

function TrendChart() {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="rate" stroke="#FB923C" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;