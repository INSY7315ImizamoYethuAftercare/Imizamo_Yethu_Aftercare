import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const classRows = [
    { name: "Yellow", thisWeek: 97, lastWeek: 94, present: 10, absent: 0, learners: 2 },
    { name: "Green", thisWeek: 90, lastWeek: 88, present: 9, absent: 1, learners: 2 },
    { name: "Red", thisWeek: 85, lastWeek: 90, present: 4, absent: 1, learners: 1 },
    { name: "Blue", thisWeek: 97, lastWeek: 80, present: 5, absent: 0, learners: 1 },
  ];

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
            <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
            <button onClick={() => navigate(settingsPath)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Reports <span>📊</span></h1>
          <p className="text-sm text-gray-500">Organisation attendance, trends, and PDF exports</p>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[88px] py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.97] ${
                activeTab === tab
                  ? "bg-orange-400 text-white shadow-md"
                  : "bg-transparent text-gray-500 hover:bg-orange-50 hover:text-orange-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-orange-500">6</p>
                <p className="text-xs text-gray-500 mt-1">Total Learners</p>
              </div>
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-green-500">92%</p>
                <p className="text-xs text-gray-500 mt-1">Org attendance</p>
              </div>
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-purple-500">8</p>
                <p className="text-xs text-gray-500 mt-1">Observations</p>
              </div>
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-sky-500">4</p>
                <p className="text-xs text-gray-500 mt-1">Classes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className={card}>
                <h3 className="font-semibold text-gray-900 mb-3">Weekly Attendance</h3>
                <div className="flex justify-between items-end h-24 px-2">
                  {[
                    { day: "Mon 21", value: 5 },
                    { day: "Tue 22", value: 5 },
                    { day: "Wed 23", value: 5 },
                    { day: "Thu 24", value: 4 },
                    { day: "Fri 25", value: 4 },
                  ].map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-1">
                      <div className="w-8 bg-orange-400 rounded-t-md" style={{ height: `${item.value * 12}px` }}></div>
                      <span className="text-[10px] text-gray-500">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={card}>
                <h3 className="font-semibold text-gray-900 mb-3">Attendance by Class</h3>
                <div className="space-y-3">
                  {classRows.map((cls) => (
                    <div key={cls.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{cls.name}</span>
                        <span className="text-gray-500">{cls.thisWeek}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${cls.thisWeek}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={comingSoon} className={primary}>📄 Export as PDF</button>
          </div>
        )}

        {activeTab === "Trends" && (
          <div className="space-y-5">
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-1">Cross-class attendance</h3>
              <p className="text-xs text-gray-500 mb-4">This week vs last week — all class groups</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 font-medium">Class</th>
                      <th className="py-2 font-medium">Learners</th>
                      <th className="py-2 font-medium">Present</th>
                      <th className="py-2 font-medium">Absent</th>
                      <th className="py-2 font-medium">This week</th>
                      <th className="py-2 font-medium">Last week</th>
                      <th className="py-2 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.map((cls) => {
                      const diff = cls.thisWeek - cls.lastWeek;
                      return (
                        <tr key={cls.name} className="border-b border-gray-50">
                          <td className="py-2 font-medium text-gray-800">{cls.name}</td>
                          <td className="py-2 text-gray-600">{cls.learners}</td>
                          <td className="py-2 text-gray-600">{cls.present}</td>
                          <td className="py-2 text-gray-600">{cls.absent}</td>
                          <td className="py-2 text-gray-800">{cls.thisWeek}%</td>
                          <td className="py-2 text-gray-600">{cls.lastWeek}%</td>
                          <td className={`py-2 font-semibold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {diff >= 0 ? "+" : ""}{diff}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Organisation trend</h3>
              <div className="flex justify-between items-end h-28 px-2">
                {[
                  { label: "W1", value: 88 },
                  { label: "W2", value: 90 },
                  { label: "W3", value: 91 },
                  { label: "W4", value: 92 },
                ].map((w) => (
                  <div key={w.label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-gray-500">{w.value}%</span>
                    <div className="w-10 bg-orange-400 rounded-t-md" style={{ height: `${(w.value - 80) * 8}px` }}></div>
                    <span className="text-[10px] text-gray-500">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={comingSoon} className={primary}>📄 Export as PDF</button>
          </div>
        )}

        {activeTab === "Donor Report" && (
          <div className="space-y-5 max-w-3xl">
            <div className="bg-purple-50 rounded-2xl p-5 text-center shadow-lg border border-purple-200">
              <span className="text-3xl">💼</span>
              <h2 className="font-bold text-purple-700 text-lg mt-2">Donor Impact Report</h2>
              <p className="text-sm text-gray-500">Q3 2025 · July · Organisation-wide</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-orange-500">6</p><p className="text-xs text-gray-500 mt-1">Learners served</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-green-500">92%</p><p className="text-xs text-gray-500 mt-1">Attendance rate</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-purple-500">48</p><p className="text-xs text-gray-500 mt-1">Safe collections</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-sky-500">22</p><p className="text-xs text-gray-500 mt-1">Days delivered</p></div>
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Development observations</span><span className="font-semibold">8</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Class groups reached</span><span className="font-semibold">4</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Open sign-out escalations</span><span className="font-semibold">3</span></div>
              </div>
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                During Q3 2025, the Imizamo Yethu Learning Hub provided aftercare to 6 registered learners across 4 class groups. Organisation attendance held at 92%. Digital sign-out recorded 48 safe collections this month.
              </p>
            </div>
            <button onClick={comingSoon} className={primary}>📄 Export as PDF</button>
          </div>
        )}

        {activeTab === "Board Report" && (
          <div className="space-y-5">
            <div className="bg-orange-50 rounded-2xl p-5 text-center shadow-lg border border-orange-200">
              <span className="text-3xl">📋</span>
              <h2 className="font-bold text-orange-600 text-lg mt-2">Board Report</h2>
              <p className="text-sm text-gray-500">July 2025 · Organisation overview</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-orange-500">6</p><p className="text-xs text-gray-500 mt-1">Active learners</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-green-500">92%</p><p className="text-xs text-gray-500 mt-1">Org attendance</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-gray-800">4</p><p className="text-xs text-gray-500 mt-1">Teachers</p></div>
              <div className={`${card} text-center`}><p className="text-2xl font-bold text-red-500">0</p><p className="text-xs text-gray-500 mt-1">Safety incidents</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={card}>
                <h3 className="font-semibold text-gray-900 mb-3">Enrolment</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>6 active learners</li>
                  <li>4 class groups</li>
                  <li>1 new enrolment (July)</li>
                </ul>
              </div>
              <div className={card}>
                <h3 className="font-semibold text-gray-900 mb-3">Operations</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>Digital attendance: 100%</li>
                  <li>Sign-out system live</li>
                  <li>3 items in escalation queue</li>
                </ul>
              </div>
              <div className={card}>
                <h3 className="font-semibold text-gray-900 mb-3">Wellbeing</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>8 teacher observations</li>
                  <li>2 learners extra support</li>
                  <li>Parent portal in use</li>
                </ul>
              </div>
            </div>
            <button onClick={comingSoon} className={primary}>📄 Export as PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;