import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useClasses } from "./UseClasses";

function Attendance({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const displayName =
    role === "Admin" ? "System Admin" :
    role === "Manager" ? "Sarah Botha" : "Ms Nkosi";

  const displayRole =
    role === "Admin" ? "Admin" :
    role === "Manager" ? "Manager" : "Teacher • Yellow";

  const [selectedClass, setSelectedClass] = useState("Yellow");
  const [showSuccess, setShowSuccess] = useState(false);
  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", status: null },
    { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", status: null },
    { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", status: null },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", status: null },
    { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", status: null },
    { id: 6, name: "Sipho Dlamini", grade: "Grade 5", group: "Blue", status: null },
  ]);

  // Tabs come from the shared class list, so every class (including Orange)
  // shows up for both teachers and managers.
  const classList = useClasses();
  const classes = ["All", ...classList.map((c) => c.name)];

  const filtered =
    selectedClass === "All"
      ? learners
      : learners.filter((l) => l.group === selectedClass);

  const presentCount = filtered.filter((l) => l.status === "present").length;
  const absentCount = filtered.filter((l) => l.status === "absent").length;

  const setStatus = (id, status) => {
    setLearners((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const shell = role === "Teacher" ? "max-w-lg mx-auto w-full" : "max-w-5xl mx-auto w-full";

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
          <button onClick={comingSoon} className={iconBtn}>🔔</button>
          {showSettings && (
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          )}
          <MoreMenu />
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Attendance <span>✓</span></h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} learners</p>
        </div>

        <div className="flex gap-2 mt-4 mb-5 overflow-x-auto py-2">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-md border transition active:scale-95 ${
                selectedClass === cls
                  ? "bg-orange-400 text-white border-orange-400"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 text-center">
            <p className="text-2xl font-bold text-green-500">{presentCount}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No learners in this class yet.</p>
          )}
          {filtered.map((learner) => (
            <div key={learner.id} className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(learner.id, "present")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold shadow-md border transition active:scale-95 ${
                    learner.status === "present"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus(learner.id, "absent")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold shadow-md border transition active:scale-95 ${
                    learner.status === "absent"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        {showSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            Attendance saved
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default Attendance;