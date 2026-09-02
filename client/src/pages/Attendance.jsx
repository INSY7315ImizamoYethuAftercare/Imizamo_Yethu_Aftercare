import { useState } from "react";

function Attendance() {
  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", status: "Present" },
    { id: 2, name: "Amara Okoye", grade: "Grade 1", status: "Present" },
    { id: 3, name: "Liam van der Berg", grade: "Grade 4", status: "Present" },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", status: "Present" },
    { id: 5, name: "Zoe Ntombela", grade: "Grade 6", status: "Present" },
    { id: 6, name: "Sipho Mkhize", grade: "Grade 7", status: "Absent" },
  ]);

  const [selectedGroup, setSelectedGroup] = useState("Yellow");

  const toggleStatus = (id, newStatus) => {
    setLearners((prev) =>
      prev.map((learner) =>
        learner.id === id ? { ...learner, status: newStatus } : learner
      )
    );
  };

  // Mark everyone as Present
  const markAllPresent = () => {
    setLearners((prev) =>
      prev.map((learner) => ({ ...learner, status: "Present" }))
    );
  };

  // Mark everyone as Absent
  const clearAll = () => {
    setLearners((prev) =>
      prev.map((learner) => ({ ...learner, status: "Absent" }))
    );
  };

  const presentCount = learners.filter((l) => l.status === "Present").length;

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Imizamo Yethu Learning Hub" 
            className="w-9 h-9 object-contain"
          />
          <div>
            <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
            <p className="text-xs text-gray-500">Teacher • Yellow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <span className="text-lg">🔔</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <span className="text-lg">⋮</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-5 pb-28">
        
        {/* Title + Date */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Attendance <span className="text-green-500">✓</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Wed, 29 Jul</p>
        </div>

        {/* Colour Group Filters */}
        <div className="flex gap-2 mb-5">
          {["Yellow", "Green", "Red", "Blue"].map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedGroup === group
                  ? group === "Yellow"
                    ? "bg-yellow-300 text-gray-800"
                    : group === "Green"
                    ? "bg-green-400 text-white"
                    : group === "Red"
                    ? "bg-red-500 text-white"
                    : "bg-sky-400 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Counter Card */}
        <div className={`rounded-2xl p-4 mb-5 flex items-center justify-between ${
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
              {presentCount} / {learners.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">learners present</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={markAllPresent}
              className="px-4 py-1.5 rounded-full bg-emerald-400 text-white text-sm font-medium"
            >
              All In
            </button>
            <button 
              onClick={clearAll}
              className="px-4 py-1.5 rounded-full bg-white text-gray-500 text-sm font-medium border border-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Learner Cards */}
        <div className="space-y-3 mb-6">
          {learners.map((learner) => (
            <div 
              key={learner.id}
              className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">{learner.grade}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(learner.id, "Present")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    learner.status === "Present"
                      ? "bg-emerald-400 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => toggleStatus(learner.id, "Absent")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    learner.status === "Absent"
                      ? "bg-orange-400 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Session Notes */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            SESSION NOTES (optional)
          </label>
          <textarea
            placeholder="Any notes about today's session..."
            className="w-full h-24 p-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          ></textarea>
        </div>

        {/* Save Button */}
        <button className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base shadow-sm active:scale-[0.98] transition">
          Save Attendance
        </button>

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button className="flex flex-col items-center text-green-500 gap-0.5">
          <span className="text-lg">✓</span>
          <span className="text-[10px] font-medium">Attendance</span>
        </button>

        <button className="flex flex-col items-center text-red-400 gap-0.5">
          <span className="text-lg">🎒</span>
          <span className="text-[10px]">Learners</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏫</span>
          <span className="text-[10px]">Classes</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🚪</span>
          <span className="text-[10px]">Sign Out</span>
        </button>
      </div>

    </div>
  );
}

export default Attendance;