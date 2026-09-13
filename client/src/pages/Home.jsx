import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");

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
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition shadow-sm">🔔</button>
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition shadow-sm">⋮</button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-md">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, Ms! 👋</h1>
          <p className="text-sm mt-1 opacity-90">5 of 6 learners present today</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Present Today</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Signed Out</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎒</span>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
            <p className="text-xs text-gray-500">Total Learners</p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => navigate("/attendance")} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-2 hover:shadow-lg hover:border-orange-200 active:scale-[0.97] transition">
            <span className="text-2xl text-green-500">✓</span>
            <span className="text-sm font-semibold text-gray-800">Mark Attendance</span>
          </button>
          <button onClick={() => navigate("/learners")} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-2 hover:shadow-lg hover:border-orange-200 active:scale-[0.97] transition">
            <span className="text-2xl">🎒</span>
            <span className="text-sm font-semibold text-gray-800">View Learners</span>
          </button>
          <button onClick={() => navigate("/signout")} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-2 col-span-2 hover:shadow-lg hover:border-orange-200 active:scale-[0.97] transition">
            <span className="text-2xl">🚪</span>
            <span className="text-sm font-semibold text-gray-800">Sign-Out</span>
          </button>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100">
          {[
            { icon: "🚪", title: "Zoe Ntombela signed out", sub: "Ms Williams", time: "17:45", colour: "text-orange-400" },
            { icon: "📝", title: "Liam van der Berg — observation added", sub: "Mr Dlamini", time: "17:30", colour: "" },
            { icon: "🚪", title: "Aisha Petersen signed out", sub: "Ms Nkosi", time: "17:15", colour: "text-orange-400" },
            { icon: "✓", title: "Attendance marked — Red class", sub: "Ms Williams", time: "14:00", colour: "text-green-500" },
            { icon: "✓", title: "Attendance marked — Yellow class", sub: "Ms Nkosi", time: "13:45", colour: "text-green-500" },
          ].map((item) => (
            <div key={item.title} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={item.colour}>{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;