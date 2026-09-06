import { useState } from "react";

function SignOut() {
  // Temporary fake data
  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", status: "Present today" },
    { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", status: "Present today" },
    { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", status: "Present today" },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", status: "Present today" },
    { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", status: "Present today" },
  ]);

  const [search, setSearch] = useState("");

  const filteredLearners = learners.filter((learner) =>
    learner.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      
      {/* Top Header */}
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
        
        {/* Title */}
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Digital Sign-Out <span>🚪</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredLearners.length} learners still to be collected
          </p>
        </div>

        {/* Search */}
        <div className="mt-4 mb-5">
          <input
            type="text"
            placeholder="Search learner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Learner List */}
        <div className="space-y-3">
          {filteredLearners.map((learner) => (
            <div
              key={learner.id}
              className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">
                  {learner.grade} • {learner.group}
                </p>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <span>✓</span> {learner.status}
                </p>
              </div>

              <button className="px-4 py-1.5 rounded-full bg-orange-100 text-orange-500 text-sm font-medium">
                Sign Out →
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">✓</span>
          <span className="text-[10px]">Attendance</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🎒</span>
          <span className="text-[10px]">Learners</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏫</span>
          <span className="text-[10px]">Classes</span>
        </button>
        <button className="flex flex-col items-center text-orange-500 gap-0.5">
          <span className="text-lg">🚪</span>
          <span className="text-[10px] font-medium">Sign Out</span>
        </button>
      </div>

    </div>
  );
}

export default SignOut;