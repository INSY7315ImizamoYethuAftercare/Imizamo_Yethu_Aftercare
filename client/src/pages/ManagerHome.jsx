import { useNavigate } from "react-router-dom";
import { useClasses, classOverviewRows } from "./UseClasses";
import { useHeader } from "./UseHeader";

function ManagerHome() {
  const { displayName, displayRole } = useHeader();
  const navigate = useNavigate();
  const classOverview = classOverviewRows(useClasses());
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex flex-col items-center gap-2 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition relative";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Imizamo Yethu Learning Hub" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200">🔔</button>
            <button onClick={() => navigate("/settings")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200">⚙️</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, Sarah! 👋</h1>
          <p className="text-sm mt-1 opacity-90">5 of 6 learners present • 3 sign-outs need review</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={card}>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500">Present Today</p>
          </div>
          <div className={card}>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500">Signed Out</p>
          </div>
          <div className={card}>
            <p className="text-2xl font-bold text-gray-900">6</p>
            <p className="text-xs text-gray-500">Total Learners</p>
          </div>
          <div className={card}>
            <p className="text-2xl font-bold text-orange-500">3</p>
            <p className="text-xs text-gray-500">Escalations</p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => navigate("/manager/attendance")} className={action}>
            <span className="text-2xl text-green-500">✓</span>
            <span className="text-sm font-semibold text-gray-800">Attendance</span>
          </button>
          <button onClick={() => navigate("/manager/learners")} className={action}>
            <span className="text-2xl">🎒</span>
            <span className="text-sm font-semibold text-gray-800">Learners</span>
          </button>
          <button onClick={() => navigate("/manager/signout")} className={action}>
            <span className="text-2xl">🚪</span>
            <span className="text-sm font-semibold text-gray-800">Sign-Out</span>
          </button>
          <button onClick={() => navigate("/manager/escalations")} className={action}>
            <span className="absolute top-2 right-2 text-[10px] bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">3</span>
            <span className="text-2xl">🚨</span>
            <span className="text-sm font-semibold text-gray-800">Queue</span>
          </button>
          <button onClick={() => navigate("/manager/staff")} className={action}>
            <span className="text-2xl">👥</span>
            <span className="text-sm font-semibold text-gray-800">Staff</span>
          </button>
          <button onClick={() => navigate("/reports")} className={action}>
            <span className="text-2xl">📊</span>
            <span className="text-sm font-semibold text-gray-800">Reports</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Class Overview</h2>
            <div className={`${card} space-y-4`}>
              {classOverview.map((cls) => (
                <div key={cls.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: cls.hex }}></span>
                      {cls.name}
                    </span>
                    <span className="text-gray-500">{cls.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: cls.width, backgroundColor: cls.hex }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 divide-y divide-gray-100">
              {[
                { title: "Zoe Ntombela — flagged unknown collector", sub: "Ms Williams", time: "17:42" },
                { title: "Sipho Dlamini — walking home flagged", sub: "Mr Naidoo", time: "17:20" },
                { title: "Aisha Petersen signed out", sub: "Ms Nkosi", time: "17:15" },
              ].map((item) => (
                <div key={item.title} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerHome;