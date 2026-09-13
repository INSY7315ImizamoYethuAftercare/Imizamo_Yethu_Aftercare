import { useState } from "react";

function Classes({ role = "Teacher" }) {
  const isManager = role === "Manager";
  const displayName = isManager ? "Sarah Botha" : "Ms Nkosi";
  const displayRole = isManager ? "Manager" : "Teacher • Yellow";
  const comingSoon = () => alert("Coming soon");

  const [classes, setClasses] = useState([
    { id: 1, name: "Yellow", grade: "Gr 1-2", colour: "bg-yellow-300" },
    { id: 2, name: "Green", grade: "Gr 3-4", colour: "bg-green-400" },
    { id: 3, name: "Red", grade: "Gr 5-6", colour: "bg-red-400" },
    { id: 4, name: "Blue", grade: "Gr 7", colour: "bg-sky-400" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(null);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("Gr 1-2");
  const [newColour, setNewColour] = useState("bg-yellow-300");

  const gradeOptions = ["Gr 1-2", "Gr 3-4", "Gr 5-6", "Gr 7"];
  const colourOptions = [
    { value: "bg-yellow-300" },
    { value: "bg-sky-400" },
    { value: "bg-red-400" },
    { value: "bg-purple-400" },
    { value: "bg-pink-400" },
    { value: "bg-green-400" },
    { value: "bg-orange-400" },
  ];

  const handleAdd = () => {
    if (!newName.trim()) return;
    setClasses([...classes, { id: Date.now(), name: newName, grade: newGrade, colour: newColour }]);
    setNewName("");
    setNewGrade("Gr 1-2");
    setNewColour("bg-yellow-300");
    setShowAddModal(false);
  };

  const handleRemove = (id) => {
    setClasses(classes.filter((c) => c.id !== id));
    setShowRemoveModal(null);
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Classes <span>🏫</span></h1>
            <p className="text-sm text-gray-500">{classes.length} classrooms</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-md hover:bg-orange-500 hover:shadow-lg active:scale-95 transition"
          >
            + Add Class
          </button>
        </div>

        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-md border border-gray-100 hover:shadow-lg hover:border-orange-200 transition">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${cls.colour} flex items-center justify-center shadow-sm`}>🏫</div>
                <div>
                  <p className="font-semibold text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500">{cls.grade}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${cls.colour}`}></div>
                <button
                  onClick={() => setShowRemoveModal(cls)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 active:scale-95 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add New Classroom</h2>
            <p className="text-sm text-gray-500 mb-4">Create a new class group for your learners</p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">CLASS NAME *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Ladybirds, Comets" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">GRADE RANGE *</label>
                <div className="flex flex-wrap gap-2">
                  {gradeOptions.map((g) => (
                    <button key={g} onClick={() => setNewGrade(g)} className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm active:scale-95 transition ${newGrade === g ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">CLASS COLOUR</label>
                <div className="flex flex-wrap gap-2">
                  {colourOptions.map((c) => (
                    <button key={c.value} onClick={() => setNewColour(c.value)} className={`w-8 h-8 rounded-full ${c.value} shadow-sm active:scale-95 transition ${newColour === c.value ? "ring-2 ring-offset-2 ring-gray-400" : ""}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">Add Classroom</button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Remove Class?</h2>
            <div className="bg-orange-50 rounded-xl px-4 py-3 mb-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${showRemoveModal.colour}`}></div>
              <div>
                <p className="font-medium text-gray-900">{showRemoveModal.name}</p>
                <p className="text-sm text-gray-500">{showRemoveModal.grade}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRemoveModal(null)} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition">Cancel</button>
              <button onClick={() => handleRemove(showRemoveModal.id)} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500 active:scale-[0.98] transition">🗑️ Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;