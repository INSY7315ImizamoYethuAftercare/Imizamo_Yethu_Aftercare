import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";

function Classes({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const isManager = role === "Manager";
  const displayName = isManager ? "Sarah Botha" : "Ms Nkosi";
  const displayRole = isManager ? "Manager" : "Teacher • Yellow";
  const learnersPath = isManager ? "/manager/learners" : "/learners";
  const shell = isManager ? "max-w-5xl mx-auto w-full" : "max-w-lg mx-auto w-full";

  const classes = [
    { name: "Yellow", teacher: "Ms Nkosi", present: "2/2", colour: "bg-yellow-300" },
    { name: "Green", teacher: "Mr Dlamini", present: "2/2", colour: "bg-green-300" },
    { name: "Red", teacher: "Ms Williams", present: "1/1", colour: "bg-red-300" },
    { name: "Blue", teacher: "Mr Naidoo", present: "0/1", colour: "bg-sky-300" },
  ];

  const visible = isManager ? classes : classes.filter((c) => c.name === "Yellow");

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
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <MoreMenu />
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Classes <span>🏫</span></h1>
          <p className="text-sm text-gray-500 mt-1">{visible.length} class group{visible.length === 1 ? "" : "s"}</p>
        </div>

        <div className="space-y-3">
          {visible.map((cls) => (
            <button
              key={cls.name}
              onClick={() => navigate(`${learnersPath}?group=${cls.name}`)}
              className="w-full bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-lg border border-gray-200 text-left hover:border-orange-300 active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <span className={`w-3 h-10 rounded-full ${cls.colour}`}></span>
                <div>
                  <p className="font-semibold text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500">{cls.teacher}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{cls.present}</p>
                <p className="text-xs text-gray-400">present</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Classes;