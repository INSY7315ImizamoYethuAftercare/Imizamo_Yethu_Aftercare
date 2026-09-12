import { useNavigate } from "react-router-dom";

function AdminHome() {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">System Admin</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">
            🔔
          </button>
          <button
            onClick={() => navigate("/admin/settings")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        
        {/* Greeting */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-md">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, System! 👋</h1>
          <p className="text-sm mt-1 opacity-90">5 of 6 learners present today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Present Today</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Signed Out</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎒</span>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
            <p className="text-xs text-gray-500">Total Learners</p>
          </div>
        </div>

        {/* Quick Actions - Admin focused */}
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 mb-6">
          <button
            onClick={() => navigate("/admin/reports")}
            className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-2 hover:shadow-lg hover:border-orange-200 active:scale-[0.97] transition"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-semibold text-gray-800">Reports</span>
          </button>
        </div>

        {/* Class Overview */}
        <h2 className="font-semibold text-gray-900 mb-3">Class Overview</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          {[
            { name: "Yellow", value: "2/2", width: "100%", colour: "bg-yellow-400", text: "text-yellow-600" },
            { name: "Green", value: "2/2", width: "100%", colour: "bg-green-400", text: "text-green-600" },
            { name: "Red", value: "1/1", width: "100%", colour: "bg-red-400", text: "text-red-500" },
            { name: "Blue", value: "0/1", width: "0%", colour: "bg-sky-400", text: "text-sky-500" },
          ].map((cls) => (
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