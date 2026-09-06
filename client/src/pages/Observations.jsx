import { useState } from "react";

function Observations() {
  const [activeTab, setActiveTab] = useState("Observations");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");

  const [observations, setObservations] = useState([
    {
      id: 1,
      category: "Social",
      date: "2025-07-15",
      note: "Showed great leadership during group activity today.",
      teacher: "Ms Nkosi",
    },
    {
      id: 2,
      category: "Academic",
      date: "2025-07-08",
      note: "Reading fluency improving significantly. Completed level 3 book.",
      teacher: "Ms Nkosi",
    },
  ]);

  const categories = ["Academic", "Social", "Wellbeing", "Creative", "Physical"];

  const getCategoryColour = (category) => {
    switch (category) {
      case "Social": return "text-cyan-500";
      case "Academic": return "text-blue-500";
      case "Wellbeing": return "text-green-500";
      case "Creative": return "text-pink-500";
      case "Physical": return "text-purple-500";
      default: return "text-gray-500";
    }
  };

  const getCategoryBg = (category) => {
    switch (category) {
      case "Social": return "bg-cyan-400 text-white";
      case "Academic": return "bg-blue-400 text-white";
      case "Wellbeing": return "bg-green-400 text-white";
      case "Creative": return "bg-pink-400 text-white";
      case "Physical": return "bg-purple-400 text-white";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  const handleSave = () => {
    if (!note.trim()) return;

    const newObservation = {
      id: Date.now(),
      category: selectedCategory,
      date: new Date().toISOString().split("T")[0],
      note: note,
      teacher: "Ms Nkosi",
    };

    setObservations([newObservation, ...observations]);
    setNote("");
    setSelectedCategory("Academic");
    setShowForm(false);
  };

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

      {/* Learner Header Banner */}
      <div className="bg-yellow-300 px-4 py-4">
        <button className="text-sm text-gray-700 mb-2 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Aisha Petersen</h1>
        <p className="text-sm text-gray-700">Grade 2 • Yellow</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-4 pb-28">
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-green-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-800">7 yrs</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">
            Reading Club
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
            Art
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {["Profile", "Observations", "Attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-yellow-300 text-gray-800"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ===================== PROFILE TAB ===================== */}
        {activeTab === "Profile" && (
          <div className="space-y-4">
            {/* Parent / Guardian */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👤</span>
                <h3 className="font-semibold text-gray-900">Parent / Guardian</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-800 font-medium">Fatima Petersen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-800 font-medium">072 345 6789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-800 font-medium">fatima.petersen@gmail.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="text-gray-800 font-medium text-right">14 Kloof Street, Hout Bay</span>
                </div>
              </div>
            </div>

            {/* Authorised Pickups */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500">✓</span>
                <h3 className="font-semibold text-gray-900">Authorised Pickups</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span>👤</span> Fatima Petersen
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span>👤</span> Ahmed Petersen
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span>👤</span> Zainab Hendricks
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span>📌</span>
                <h3 className="font-semibold text-gray-900">Notes</h3>
              </div>
              <p className="text-sm text-gray-700">
                Loves reading. Mild peanut allergy.
              </p>
            </div>
          </div>
        )}

        {/* ===================== OBSERVATIONS TAB ===================== */}
        {activeTab === "Observations" && (
          <>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-6 shadow-sm"
              >
                + Add Observation
              </button>
            )}

            {showForm && (
              <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">New Observation</h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        selectedCategory === cat
                          ? getCategoryBg(cat)
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write your observation here..."
                  className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4"
                ></textarea>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setNote("");
                    }}
                    className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-medium text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {observations.map((obs) => (
                <div key={obs.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${getCategoryColour(obs.category)}`}>
                      {obs.category}
                    </span>
                    <span className="text-xs text-gray-400">{obs.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{obs.note}</p>
                  <p className="text-xs text-gray-400">— {obs.teacher}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===================== ATTENDANCE TAB ===================== */}
        {activeTab === "Attendance" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="text-gray-800 font-medium">2025-07-25</p>
                  <p className="text-gray-500 text-xs">Signed out by Zainab Hendricks at 17:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="text-gray-800 font-medium">2025-07-24</p>
                  <p className="text-gray-500 text-xs">Signed out by Fatima Petersen at 17:15</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-red-500">✗</span>
                <div>
                  <p className="text-gray-800 font-medium">2025-07-23</p>
                  <p className="text-gray-500 text-xs">Absent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="text-gray-800 font-medium">2025-07-22</p>
                  <p className="text-gray-500 text-xs">Signed out by Ahmed Petersen at 17:45</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="text-gray-800 font-medium">2025-07-21</p>
                  <p className="text-gray-500 text-xs">Signed out by Fatima Petersen at 17:30</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Observations;