import { useState } from "react";

function Attendance({ role = "Teacher" }) {
  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", status: "Present" },
    { id: 2, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", status: "Present" },
    { id: 3, name: "Liam van der Berg", grade: "Grade 4", group: "Green", status: "Present" },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", status: "Present" },
    { id: 5, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", status: "Present" },
    { id: 6, name: "Sipho Mkhize", grade: "Grade 7", group: "Blue", status: "Absent" },
  ]);

  const [selectedGroup, setSelectedGroup] = useState("Yellow");
  const comingSoon = () => alert("Coming soon");

  const displayName =
    role === "Admin" ? "System Admin" :
    role === "Manager" ? "Sarah Botha" : "Ms Nkosi";

  const displayRole =
    role === "Admin" ? "Admin" :
    role === "Manager" ? "Manager" : `Teacher • ${selectedGroup}`;

  const filteredLearners = learners.filter((l) => l.group === selectedGroup);

  const toggleStatus = (id, newStatus) => {
    setLearners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  };

  const markAllPresent = () => {
    setLearners((prev) =>
      prev.map((l) => (l.group === selectedGroup ? { ...l, status: "Present" } : l))
    );
  };

  const clearAll = () => {
    setLearners((prev) =>
      prev.map((l) => (l.group === selectedGroup ? { ...l, status: "Absent" } : l))
    );
  };

  const presentCount = filteredLearners.filter((l) => l.status === "Present").length;

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
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">⋮</button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Attendance <span className="text-green-500">✓</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Wed, 29 Jul</p>
        </div>

        <div className="flex gap-2 mb-5">
          {["Yellow", "Green", "Red", "Blue"].map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm active:scale-95 transition ${
                selectedGroup === group
                  ? group === "Yellow" ? "bg-yellow-300 text-gray-800"
                  : group === "Green" ? "bg-green-400 text-white"
                  : group === "Red" ? "bg-red-500 text-white"
                  : "bg-sky-400 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className={`rounded-2xl p-4 mb-5 flex items-center justify-between shadow-sm ${
          selectedGroup === "Yellow" ? "bg-yellow-100" :
          selectedGroup === "Green" ? "bg-green-100" :
          selectedGroup === "Red" ? "bg-red-100" : "bg-sky-100"
        }`}>
          <div>
            <p className={`text-3xl font-bold ${
              selectedGroup === "Yellow" ? "text-yellow-500" :
              selectedGroup === "Green" ? "text-green-600" :
              selectedGroup === "Red" ? "text-red-500" : "text-sky-500"
            }`}>
              {presentCount} / {filteredLearners.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">learners present</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllPresent} className="px-4 py-1.5 rounded-full bg-emerald-400 text-white text-sm font-medium shadow-sm hover:bg-emerald-500 active:scale-95 transition">All In</button>
            <button onClick={clearAll} className="px-4 py-1.5 rounded-full bg-white text-gray-600 text-sm font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition">Clear</button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {filteredLearners.map((learner) => (
            <div key={learner.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">{learner.grade}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(learner.id, "Present")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm active:scale-95 transition ${
                    learner.status === "Present" ? "bg-emerald-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => toggleStatus(learner.id, "Absent")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm active:scale-95 transition ${
                    learner.status === "Absent" ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-2">SESSION NOTES (optional)</label>
          <textarea
            placeholder="Any notes about today's session..."
            className="w-full h-24 p-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>

        <button className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base shadow-md hover:bg-orange-500 active:scale-[0.98] transition">
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default Attendance;