import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Learners({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");

  const displayName =
    role === "Admin" ? "System Admin" :
    role === "Manager" ? "Sarah Botha" : "Ms Nkosi";

  const displayRole =
    role === "Admin" ? "Admin" :
    role === "Manager" ? "Manager" : "Teacher • Yellow";

  const observationsPath =
    role === "Admin" ? "/admin/observations" :
    role === "Manager" ? "/manager/learners" : // fallback until manager observations route exists
    "/observations";

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

  const filteredLearners = learners.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "All Classes" || l.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleRemove = (id) => {
    setLearners(learners.filter((l) => l.id !== id));
    setShowRemoveModal(null);
  };

  const openLearner = () => {
    // For now all cards open the same demo profile screen
    if (role === "Admin") navigate("/admin/observations");
    else if (role === "Manager") navigate("/observations");
    else navigate("/observations");
  };

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Learners <span>🎒</span></h1>
            <p className="text-sm text-gray-500">{learners.length} learners enrolled</p>
          </div>
          {role !== "Admin" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-md hover:bg-orange-500 active:scale-95 transition"
            >
              + Add
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search learners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm mb-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <div className="flex gap-2 mb-5 overflow-x-auto">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shadow-sm active:scale-95 transition ${
                selectedGroup === group
                  ? "bg-orange-400 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredLearners.map((learner) => (
            <button
              key={learner.id}
              onClick={openLearner}
              className="w-full text-left bg-white rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-orange-100 border border-transparent active:scale-[0.99] transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
                  <div className="flex gap-1.5 mt-2">
                    {learner.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-green-500">{learner.attendance}%</span>
                  {role !== "Admin" && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRemoveModal(learner);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 active:scale-95 transition"
                    >
                      🗑️
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add New Student</h2>
            <p className="text-sm text-gray-500 mb-4">Fill in the learner’s details below</p>
            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name *" className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
                <input placeholder="Last Name *" className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <input placeholder="Grade *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              <input placeholder="Class" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              <input placeholder="Parent Name *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              <input placeholder="Parent Phone" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              <input placeholder="Parent Email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remove Learner?</h2>
            <div className="bg-orange-50 rounded-xl px-4 py-3 mb-3">
              <p className="font-medium text-gray-900">{showRemoveModal.name}</p>
              <p className="text-sm text-gray-500">{showRemoveModal.grade} • {showRemoveModal.group}</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove this learner from the system.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveModal(null)} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition">Cancel</button>
              <button onClick={() => handleRemove(showRemoveModal.id)} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">🗑️ Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Learners;