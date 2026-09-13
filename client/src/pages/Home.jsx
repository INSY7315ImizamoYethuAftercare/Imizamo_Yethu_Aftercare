import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex flex-col items-center gap-2 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Imizamo Yethu Learning Hub" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
            <p className="text-xs text-gray-500">Teacher • Yellow</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">⋮</button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg mx-auto w-full">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, Thandi! 👋</h1>
          <p className="text-sm mt-1 opacity-90">Yellow class • 2 of 2 present</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-green-500">2</p>
            <p className="text-[11px] text-gray-500 mt-1">Present</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-gray-800">0</p>
            <p className="text-[11px] text-gray-500 mt-1">Absent</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-orange-500">2</p>
            <p className="text-[11px] text-gray-500 mt-1">Signed out</p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => navigate("/attendance")} className={action}>
            <span className="text-2xl text-green-500">✓</span>
            <span className="text-sm font-semibold text-gray-800">Attendance</span>
          </button>
          <button onClick={() => navigate("/learners")} className={action}>
            <span className="text-2xl">🎒</span>
            <span className="text-sm font-semibold text-gray-800">Learners</span>
          </button>
          <button onClick={() => navigate("/classes")} className={action}>
            <span className="text-2xl">🏫</span>
            <span className="text-sm font-semibold text-gray-800">Classes</span>
          </button>
          <button onClick={() => navigate("/signout")} className={action}>
            <span className="text-2xl">🚪</span>
            <span className="text-sm font-semibold text-gray-800">Sign-Out</span>
          </button>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 divide-y divide-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Aisha Petersen signed out</p>
              <p className="text-xs text-gray-500">Collected by Fatima Petersen</p>
            </div>
            <span className="text-xs text-gray-400">17:15</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Attendance marked</p>
              <p className="text-xs text-gray-500">Yellow class complete</p>
            </div>
            <span className="text-xs text-gray-400">13:45</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;