import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Learners({ role = "Teacher" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const comingSoon = () => alert("Coming soon");

  const displayName =
    role === "Admin" ? "System Admin" :
    role === "Manager" ? "Sarah Botha" : "Ms Nkosi";

  const displayRole =
    role === "Admin" ? "Admin" :
    role === "Manager" ? "Manager" : "Teacher • Yellow";

  const observationsPath =
    role === "Admin" ? "/admin/observations" : "/observations";

  const startGroup = searchParams.get("group") || "All";
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState(startGroup);

  const learners = [
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow" },
    { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green" },
    { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red" },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green" },
    { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow" },
    { id: 6, name: "Sipho Dlamini", grade: "Grade 5", group: "Blue" },
  ];

  const classes = ["All", "Yellow", "Green", "Red", "Blue"];

  const filtered = learners.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "All" || l.group === selectedClass;
    return matchesSearch && matchesClass;
  });

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
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">⋮</button>
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Learners <span>🎒</span></h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} learners</p>
        </div>

        <input
          type="text"
          placeholder="Search learner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-4 mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <div className="flex gap-2 mb-5 overflow-x-auto py-2">
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

        <div className="space-y-3">
          {filtered.map((learner) => (
            <button
              key={learner.id}
              onClick={() => navigate(observationsPath)}
              className="w-full bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200 text-left hover:border-orange-300 active:scale-[0.98] transition"
            >
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
              </div>
              <span className="text-orange-400 font-semibold">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Learners;