import { useState } from "react";

function Learners() {
  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", attendance: 94, tags: ["Reading Club", "Art"] },
    { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", attendance: 88, tags: ["Football", "Maths Club"] },
    { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", attendance: 97, tags: ["Peer Mentor", "Drama"] },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", attendance: 91, tags: ["Art", "Drama"] },
    { id: 5, name: "Sipho Mkhize", grade: "Grade 7", group: "Blue", attendance: 85, tags: ["Tech Club", "Football"] },
    { id: 6, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", attendance: 99, tags: ["New", "Puzzles"] },
  ]);

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All Classes");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

  const groups = ["All Classes", "Yellow", "Green", "Red", "Blue"];

  const filteredLearners = learners.filter((learner) => {
    const matchesSearch = learner.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "All Classes" || learner.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleRemove = (id) => {
    setLearners(learners.filter((l) => l.id !== id));
    setShowRemoveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
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
        
        {/* Title + Add button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Learners <span>🎒</span>
            </h1>
            <p className="text-sm text-gray-500">{learners.length} learners enrolled</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-medium"
          >
            + Add
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search learners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        {/* Group Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedGroup === group
                  ? "bg-orange-400 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Learner Cards */}
        <div className="space-y-3">
          {filteredLearners.map((learner) => (
            <div
              key={learner.id}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">
                    {learner.grade} • {learner.group}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {learner.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-green-500">
                    {learner.attendance}%
                  </span>
                  <button
                    onClick={() => setShowRemoveModal(learner)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add New Student</h2>
            <p className="text-sm text-gray-500 mb-4">Fill in the learner’s details below</p>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name *" className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <input placeholder="Last Name *" className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <input placeholder="Grade *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input placeholder="Class" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input placeholder="Parent Name *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input placeholder="Parent Phone" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input placeholder="Parent Email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-full bg-orange-400 text-white font-medium"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remove Learner?</h2>
            <div className="bg-orange-50 rounded-xl px-4 py-3 mb-3">
              <p className="font-medium text-gray-900">{showRemoveModal.name}</p>
              <p className="text-sm text-gray-500">{showRemoveModal.grade} • {showRemoveModal.group}</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently remove this learner from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveModal(null)}
                className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(showRemoveModal.id)}
                className="flex-1 py-3 rounded-full bg-orange-400 text-white font-medium"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">✓</span>
          <span className="text-[10px]">Attendance</span>
        </button>
        <button className="flex flex-col items-center text-orange-500 gap-0.5">
          <span className="text-lg">🎒</span>
          <span className="text-[10px] font-medium">Learners</span>
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

export default Learners;