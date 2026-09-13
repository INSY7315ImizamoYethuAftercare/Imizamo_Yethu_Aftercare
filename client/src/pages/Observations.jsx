import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Observations({ role = "Teacher" }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Observations");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");
  const comingSoon = () => alert("Coming soon");

  const displayName =
    role === "Admin" ? "System Admin" :
    role === "Manager" ? "Sarah Botha" : "Ms Nkosi";

  const displayRole =
    role === "Admin" ? "Admin" :
    role === "Manager" ? "Manager" : "Teacher • Yellow";

  const backPath =
    role === "Admin" ? "/admin/learners" :
    role === "Manager" ? "/manager/learners" : "/learners";

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
      teacher: displayName,
    };
    setObservations([newObservation, ...observations]);
    setNote("");
    setSelectedCategory("Academic");
    setShowForm(false);
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

      <div className="bg-yellow-300 px-4 py-4">
        <button
          onClick={() => navigate(backPath)}
          className="text-sm text-gray-700 mb-2 flex items-center gap-1 font-medium active:scale-95 transition"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Aisha Petersen</h1>
        <p className="text-sm text-gray-700">Grade 2 • Yellow</p>
      </div>

      <div className="flex-1 px-4 pt-4 pb-32">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-gray-100">
            <p className="text-xl font-bold text-green-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-gray-100">
            <p className="text-xl font-bold text-gray-800">7 yrs</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-gray-100">
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">Reading Club</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">Art</span>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-md border border-gray-100 flex gap-1">
          {["Profile", "Observations", "Attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
                activeTab === tab
                  ? "bg-yellow-300 text-gray-800 shadow-sm"
                  : "text-gray-500 hover:bg-yellow-50 hover:text-yellow-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👤</span>
                <h3 className="font-semibold text-gray-900">Parent / Guardian</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-800 font-medium">Fatima Petersen</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-800 font-medium">072 345 6789</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800 font-medium">fatima.petersen@gmail.com</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-gray-800 font-medium text-right">14 Kloof Street, Hout Bay</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500">✓</span>
                <h3 className="font-semibold text-gray-900">Authorised Pickups</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-800"><span>👤</span> Fatima Petersen</div>
                <div className="flex items-center gap-2 text-sm text-gray-800"><span>👤</span> Ahmed Petersen</div>
                <div className="flex items-center gap-2 text-sm text-gray-800"><span>👤</span> Zainab Hendricks</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span>📌</span>
                <h3 className="font-semibold text-gray-900">Notes</h3>
              </div>
              <p className="text-sm text-gray-700">Loves reading. Mild peanut allergy.</p>
            </div>
          </div>
        )}

        {activeTab === "Observations" && (
          <>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-6 shadow-md hover:bg-orange-500 hover:shadow-lg active:scale-[0.98] transition"
              >
                + Add Observation
              </button>
            )}

            {showForm && (
              <div className="bg-white rounded-2xl p-4 mb-6 shadow-md border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">New Observation</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm active:scale-95 transition ${
                        selectedCategory === cat ? getCategoryBg(cat) : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                  className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4 shadow-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowForm(false); setNote(""); }}
                    className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-md hover:bg-orange-500 active:scale-[0.98] transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {observations.map((obs) => (
                <div key={obs.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${getCategoryColour(obs.category)}`}>{obs.category}</span>
                    <span className="text-xs text-gray-400">{obs.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{obs.note}</p>
                  <p className="text-xs text-gray-400">— {obs.teacher}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "Attendance" && (
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              {[
                { date: "2025-07-25", detail: "Signed out by Zainab Hendricks at 17:00", ok: true },
                { date: "2025-07-24", detail: "Signed out by Fatima Petersen at 17:15", ok: true },
                { date: "2025-07-23", detail: "Absent", ok: false },
                { date: "2025-07-22", detail: "Signed out by Ahmed Petersen at 17:45", ok: true },
                { date: "2025-07-21", detail: "Signed out by Fatima Petersen at 17:30", ok: true },
              ].map((row) => (
                <div key={row.date} className="flex items-center gap-3 text-sm">
                  <span className={row.ok ? "text-green-500" : "text-red-500"}>{row.ok ? "✓" : "✗"}</span>
                  <div>
                    <p className="text-gray-800 font-medium">{row.date}</p>
                    <p className="text-gray-500 text-xs">{row.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Observations;