import { useNavigate } from "react-router-dom";
import { useClasses, classOverviewRows } from "./UseClasses";
import { useHeader } from "./UseHeader";

function AdminHome() {
  const { displayName, displayRole } = useHeader();
  const navigate = useNavigate();
  const classOverview = classOverviewRows(useClasses());
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex flex-col items-center gap-2 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";

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
            <button onClick={() => navigate("/admin/settings")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, System! 👋</h1>
          <p className="text-sm mt-1 opacity-90">5 of 6 learners present today</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className={card}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Present Today</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>
          <div className={card}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Signed Out</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>
          <div className={`${card} col-span-2 md:col-span-1`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎒</span>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
            <p className="text-xs text-gray-500">Total Learners</p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => navigate("/admin/reports")} className={action}>
            <span className="text-2xl">📊</span>
            <span className="text-sm font-semibold text-gray-800">Reports</span>
          </button>
          <button onClick={() => navigate("/admin/learners")} className={action}>
            <span className="text-2xl">🎒</span>
            <span className="text-sm font-semibold text-gray-800">Learners</span>
          </button>
          <button onClick={() => navigate("/admin/attendance")} className={action}>
            <span className="text-2xl text-green-500">✓</span>
            <span className="text-sm font-semibold text-gray-800">Attendance</span>
          </button>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Class Overview</h2>
        <div className={`${card} grid grid-cols-1 md:grid-cols-2 gap-4`}>
          {classOverview.map((cls) => (
            <div key={cls.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className={`font-medium ${cls.text}`}>{cls.name}</span>
                <span className="text-gray-500">{cls.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${cls.colour} rounded-full`} style={{ width: cls.width }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminHome;