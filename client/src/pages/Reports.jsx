import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WeeklyChart from "../components/WeeklyChart";
import TrendChart from "../components/TrendChart";
import { exportChart } from "../utils/charts";
import { generatePDF } from "../utils/pdf";

function Reports({ role = "Manager" }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const tabs = ["Overview", "Trends", "Donor Report", "Board Report"];
  const displayName = role === "Admin" ? "System Admin" : "Sarah Botha";
  const displayRole = role === "Admin" ? "Admin" : "Manager";
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const primary =
    "w-full md:w-auto md:px-10 py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const classRows = [
    { name: "Yellow", thisWeek: 97, lastWeek: 94 },
    { name: "Green", thisWeek: 90, lastWeek: 88 },
    { name: "Red", thisWeek: 85, lastWeek: 90 },
    { name: "Blue", thisWeek: 97, lastWeek: 80 },
  ];

  const overviewRows = [
    { label: "Total learners", value: "6" },
    { label: "Organisation attendance", value: "92%" },
    { label: "Observations", value: "8" },
    { label: "Class groups", value: "4" },
  ];

  const donorRows = [
    { label: "Learners served this quarter", value: "6" },
    { label: "Average attendance rate", value: "92%" },
    { label: "Safe collections this month", value: "48" },
    { label: "Days of aftercare delivered", value: "22" },
  ];

  const boardRows = [
    { label: "Active learners", value: "6" },
    { label: "Organisation attendance", value: "92%" },
    { label: "Teachers", value: "4" },
    { label: "Safety incidents", value: "0" },
  ];

  const exportOverview = () =>
    generatePDF({
      filename: "overview-report",
      title: "Overview Report",
      period: "July 2025",
      rows: overviewRows,
    });

  const exportTrends = () =>
    generatePDF({
      filename: "trends-report",
      title: "Attendance Trends",
      period: "This week vs last week",
      rows: classRows.map((c) => ({
        label: c.name,
        value: c.thisWeek + "% this week / " + c.lastWeek + "% last week",
      })),
    });

  const exportDonor = () =>
    generatePDF({
      filename: "donor-report",
      title: "Donor Impact Report",
      period: "Q3 2025",
      rows: donorRows,
    });

  const exportBoard = () =>
    generatePDF({
      filename: "board-report",
      title: "Board Report",
      period: "July 2025",
      rows: boardRows,
    });

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
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
            <button onClick={comingSoon} className={iconBtn}>🔔</button>
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Organisation attendance, trends, and PDF exports</p>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[88px] py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.97] ${
                activeTab === tab ? "bg-orange-400 text-white shadow-md" : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {overviewRows.map((row) => (
                <div key={row.label} className={`${card} text-center`}>
                  <p className="text-2xl font-bold text-orange-500">{row.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{row.label}</p>
                </div>
              ))}
            </div>
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Weekly Attendance</h3>
                <button
                  onClick={() => exportChart("weekly-attendance")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
                >
                  Export chart
                </button>
              </div>
              <WeeklyChart />
            </div>
            <button onClick={exportOverview} className={primary}>Export as PDF</button>
          </div>
        )}

        {activeTab === "Trends" && (
          <div className="space-y-5">
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Organisation trend</h3>
                <button
                  onClick={() => exportChart("org-trend")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
                >
                  Export chart
                </button>
              </div>
              <TrendChart />
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Cross-class attendance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 font-medium">Class</th>
                      <th className="py-2 font-medium">This week</th>
                      <th className="py-2 font-medium">Last week</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.map((cls) => (
                      <tr key={cls.name} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{cls.name}</td>
                        <td className="py-2">{cls.thisWeek}%</td>
                        <td className="py-2">{cls.lastWeek}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={exportTrends} className={primary}>Export as PDF</button>
          </div>
        )}

        {activeTab === "Donor Report" && (
          <div className="space-y-5 max-w-3xl">
            <div className="bg-purple-50 rounded-2xl p-5 text-center shadow-lg border border-purple-200">
              <h2 className="font-bold text-purple-700 text-lg">Donor Impact Report</h2>
              <p className="text-sm text-gray-500">Q3 2025 · Organisation-wide</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {donorRows.slice(0, 2).map((row) => (
                <div key={row.label} className={`${card} text-center`}>
                  <p className="text-2xl font-bold text-orange-500">{row.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{row.label}</p>
                </div>
              ))}
            </div>
            <button onClick={exportDonor} className={primary}>Export as PDF</button>
          </div>
        )}

        {activeTab === "Board Report" && (
          <div className="space-y-5">
            <div className="bg-orange-50 rounded-2xl p-5 text-center shadow-lg border border-orange-200">
              <h2 className="font-bold text-orange-600 text-lg">Board Report</h2>
              <p className="text-sm text-gray-500">July 2025 · Organisation overview</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {boardRows.map((row) => (
                <div key={row.label} className={`${card} text-center`}>
                  <p className="text-2xl font-bold text-orange-500">{row.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{row.label}</p>
                </div>
              ))}
            </div>
            <button onClick={exportBoard} className={primary}>Export as PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;