import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Reports({ role = "Manager" }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const tabs = ["Overview", "Donor Report", "Board Report"];

  const displayName = role === "Admin" ? "System Admin" : "Sarah Botha";
  const displayRole = role === "Admin" ? "Admin" : "Manager";
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">{displayName}</p>
            <p className="text-xs text-gray-500">{displayRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <button onClick={() => navigate(settingsPath)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">⚙️</button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Reports <span>📊</span></h1>
          <p className="text-sm text-gray-500">Analytics & PDF exports</p>
        </div>

        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full text-xs font-medium shadow-sm active:scale-95 transition ${
                activeTab === tab ? "bg-orange-400 text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-orange-500">6</p>
                <p className="text-xs text-gray-500 mt-1">Total Learners</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-green-500">92%</p>
                <p className="text-xs text-gray-500 mt-1">Avg Attendance</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-purple-500">8</p>
                <p className="text-xs text-gray-500 mt-1">Observations</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-sky-500">4</p>
                <p className="text-xs text-gray-500 mt-1">Classes</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>📅</span> Weekly Attendance</h3>
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

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Attendance by Class</h3>
              <div className="space-y-3">
                {[
                  { name: "Yellow", percent: 97, count: "2 learners", colour: "bg-yellow-400" },
                  { name: "Green", percent: 90, count: "2 learners", colour: "bg-green-400" },
                  { name: "Blue", percent: 97, count: "1 learner", colour: "bg-sky-400" },
                  { name: "Red", percent: 85, count: "1 learner", colour: "bg-red-400" },
                ].map((cls) => (
                  <div key={cls.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{cls.name}</span>
                      <span className="text-gray-500">{cls.percent}% · {cls.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cls.colour} rounded-full`} style={{ width: `${cls.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Development Categories</h3>
              <div className="space-y-3">
                {[
                  { name: "Academic", count: 3, colour: "bg-blue-400" },
                  { name: "Social", count: 2, colour: "bg-cyan-400" },
                  { name: "Wellbeing", count: 1, colour: "bg-green-400" },
                  { name: "Creative", count: 1, colour: "bg-pink-400" },
                ].map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-20">{cat.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.colour} rounded-full`} style={{ width: `${cat.count * 25}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-500 w-4">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={comingSoon} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">
              📄 Export as PDF
            </button>
          </div>
        )}

        {activeTab === "Donor Report" && (
          <div className="space-y-5">
            <div className="bg-purple-50 rounded-2xl p-5 text-center shadow-sm">
              <span className="text-3xl">💼</span>
              <h2 className="font-bold text-purple-700 text-lg mt-2">Donor Impact Report</h2>
              <p className="text-sm text-gray-500">Q3 2025 · July</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">🎒 Learners served this quarter</span><span className="font-semibold">6</span></div>
                <div className="flex justify-between"><span className="text-gray-600">📈 Average attendance rate</span><span className="font-semibold">92%</span></div>
                <div className="flex justify-between"><span className="text-gray-600">📝 Development observations</span><span className="font-semibold">8</span></div>
                <div className="flex justify-between"><span className="text-gray-600">🏠 Safe collections this month</span><span className="font-semibold">48</span></div>
                <div className="flex justify-between"><span className="text-gray-600">📅 Days of aftercare delivered</span><span className="font-semibold">22</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                During Q3 2025, the Imizamo Yethu Learning Hub successfully provided aftercare services to 6 registered learners across 4 class groups. The programme maintained a strong 92% average attendance rate, demonstrating consistent learner engagement and parental trust in our services.
              </p>
            </div>
            <button onClick={comingSoon} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">
              📄 Export as PDF
            </button>
          </div>
        )}

        {activeTab === "Board Report" && (
          <div className="space-y-5">
            <div className="bg-orange-50 rounded-2xl p-5 text-center shadow-sm">
              <span className="text-3xl">📋</span>
              <h2 className="font-bold text-orange-600 text-lg mt-2">Board Report</h2>
              <p className="text-sm text-gray-500">July 2025 · Monthly Overview</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Enrolment</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 6 active learners</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 4 class groups</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 4 qualified teachers</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 1 new enrolment (July)</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Operations</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Digital attendance: 100% compliance</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Digital sign-out system operational</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Parent portal launched</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 0 safety incidents</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Wellbeing</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 8 teacher observations</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Peer mentor programme active</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> 2 learners receiving additional support</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Parent communication: ongoing</li>
              </ul>
            </div>
            <button onClick={comingSoon} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">
              📄 Export as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;