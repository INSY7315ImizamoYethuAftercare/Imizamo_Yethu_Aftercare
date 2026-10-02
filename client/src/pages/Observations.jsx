import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useHeader } from "./UseHeader";

const CLASS_THEMES = {
  Yellow: {
    banner: "bg-yellow-300",
    tabActive: "bg-yellow-300",
    back: "bg-yellow-400 border-yellow-600 text-yellow-950",
  },
  Green: {
    banner: "bg-green-300",
    tabActive: "bg-green-300",
    back: "bg-green-500 border-green-700 text-white",
  },
  Red: {
    banner: "bg-red-300",
    tabActive: "bg-red-300",
    back: "bg-red-400 border-red-600 text-white",
  },
  Blue: {
    banner: "bg-sky-300",
    tabActive: "bg-sky-300",
    back: "bg-sky-500 border-sky-700 text-white",
  },
  Orange: {
    banner: "bg-orange-300",
    tabActive: "bg-orange-300",
    back: "bg-orange-500 border-orange-700 text-white",
  },
};

const DEFAULT_LEARNER = { name: "Aisha Petersen", grade: "Grade 2", group: "Yellow" };

function Observations({ role = "Teacher" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const learner = location.state?.learner || DEFAULT_LEARNER;
  const theme = CLASS_THEMES[learner.group] || CLASS_THEMES.Yellow;
  const [activeTab, setActiveTab] = useState("Observations");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");
  const comingSoon = () => alert("Coming soon");
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

  const { displayName, displayRole } = useHeader();

  const backPath =
    role === "Admin" ? "/admin/learners" :
    role === "Manager" ? "/manager/learners" : "/learners";

  const [observations, setObservations] = useState([
    { id: 1, category: "Social", date: "2025-07-15", note: "Showed great leadership during group activity today.", teacher: "Ms Nkosi" },
    { id: 2, category: "Academic", date: "2025-07-08", note: "Reading fluency improving significantly. Completed level 3 book.", teacher: "Ms Nkosi" },
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
    setObservations([
      {
        id: Date.now(),
        category: selectedCategory,
        date: new Date().toISOString().split("T")[0],
        note,
        teacher: displayName,
      },
      ...observations,
    ]);
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
          <button onClick={comingSoon} className={iconBtn}>🔔</button>
          {showSettings && (
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          )}
          <MoreMenu />
        </div>
      </div>

      <div className={`${theme.banner} px-4 pt-3 pb-12`}>
        <div className="max-w-lg mx-auto relative flex items-center justify-center min-h-[48px]">
          <button
            onClick={() => navigate(backPath)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full border-2 text-xs font-semibold shadow-md flex items-center gap-1 active:scale-95 transition ${theme.back}`}
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{learner.name}</h1>
            <p className="text-xs text-gray-700">{learner.grade} • {learner.group}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-0 pb-32 max-w-lg mx-auto w-full">
        <div className={`${card} -mt-10 mb-4 grid grid-cols-3 text-center relative`}>
          <div>
            <p className="text-xl font-bold text-teal-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-500">7 yrs</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">Reading Club</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">Art</span>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            { label: "Profile", icon: "👤" },
            { label: "Observations", icon: "📝" },
            { label: "Attendance", icon: "✅" },
          ].map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold shadow-md transition active:scale-[0.97] ${
                activeTab === label ? `${theme.tabActive} text-gray-800` : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className="mr-1">{icon}</span>{label}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Parent / Guardian</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">Fatima Petersen</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">072 345 6789</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">fatima.petersen@gmail.com</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-right">14 Kloof Street, Hout Bay</span></div>
              </div>
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Authorised Pickups</h3>
              <div className="space-y-2 text-sm text-gray-800">
                <p>👤 Fatima Petersen</p>
                <p>👤 Ahmed Petersen</p>
                <p>👤 Zainab Hendricks</p>
              </div>
            </div>
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-700">Loves reading. Mild peanut allergy.</p>
            </div>
          </div>
        )}

        {activeTab === "Observations" && (
          <>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold mb-6 shadow-lg hover:bg-orange-500 active:scale-[0.98] transition"
              >
                + Add Observation
              </button>
            )}
            {showForm && (
              <div className={`${card} mb-6`}>
                <h2 className="font-semibold text-gray-900 mb-3">New Observation</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-md active:scale-95 transition ${
                        selectedCategory === cat ? getCategoryBg(cat) : "bg-gray-100 text-gray-500"
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
                  className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm mb-4 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowForm(false); setNote(""); }} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg active:scale-[0.98] transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition">
                    Save
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {observations.map((obs) => (
                <div key={obs.id} className={card}>
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
          <div className={card}>
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