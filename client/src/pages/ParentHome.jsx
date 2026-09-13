import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Today");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">Fatima Petersen</p>
            <p className="text-xs text-gray-500">Parent</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/parent/settings")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 active:scale-95 transition"
        >
          ⚙️
        </button>
      </div>

      <div className="bg-yellow-300 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Aisha Petersen</h1>
          <p className="text-sm text-gray-700">Grade 2 • Yellow</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-32 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-green-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-gray-800">7 yrs</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-orange-500">2</p>
            <p className="text-xs text-gray-500">Notes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1">
          {["Today", "Week", "Notes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
                activeTab === tab ? "bg-yellow-300 text-gray-800 shadow-md" : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Today" && (
          <div className="space-y-4">
            <div className={card}>
              <p className="text-xs text-gray-500 mb-1">STATUS</p>
              <p className="font-semibold text-gray-900">Present • signed out at 17:15</p>
              <p className="text-sm text-gray-500 mt-1">Collected by Fatima Petersen</p>
            </div>
            <div className={card}>
              <p className="text-xs text-gray-500 mb-1">TODAY'S NOTE</p>
              <p className="text-sm text-gray-700">Showed great leadership during group activity today.</p>
            </div>
          </div>
        )}

        {activeTab === "Week" && (
          <div className={card}>
            <h3 className="font-semibold text-gray-900 mb-3">This week</h3>
            <div className="space-y-3 text-sm">
              <p>✓ Mon — Present</p>
              <p>✓ Tue — Present</p>
              <p>✓ Wed — Present, signed out 17:15</p>
              <p>✓ Thu — Present</p>
              <p>✓ Fri — Present</p>
            </div>
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="space-y-4">
            <div className={card}>
              <p className="text-xs text-cyan-500 font-semibold mb-1">Social</p>
              <p className="text-sm text-gray-700">Showed great leadership during group activity today.</p>
              <p className="text-xs text-gray-400 mt-2">— Ms Nkosi</p>
            </div>
            <div className={card}>
              <p className="text-xs text-blue-500 font-semibold mb-1">Academic</p>
              <p className="text-sm text-gray-700">Reading fluency improving significantly.</p>
              <p className="text-xs text-gray-400 mt-2">— Ms Nkosi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentHome;