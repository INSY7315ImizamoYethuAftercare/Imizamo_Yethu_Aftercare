import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";

const learnerRecords = {
  1: { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", dob: "2018-03-12" },
  2: { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", dob: "2016-09-04" },
  3: { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", dob: "2014-01-22" },
  4: { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", dob: "2017-11-08" },
  5: { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", dob: "2019-06-30" },
  6: { id: 6, name: "Sipho Dlamini", grade: "Grade 5", group: "Blue", dob: "2015-04-17" },
};

function ageFromDob(dob) {
  if (!dob) return "—";
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) age -= 1;
  return age + " yrs";
}

function Observations({ role = "Teacher" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const learnerId = searchParams.get("id") || "1";
  const starting = learnerRecords[learnerId] || learnerRecords[1];

  const [activeTab, setActiveTab] = useState("Profile");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedBanner, setSavedBanner] = useState("");
  const [learner, setLearner] = useState(starting);
  const [draftName, setDraftName] = useState(starting.name);
  const [draftDob, setDraftDob] = useState(starting.dob);

  const comingSoon = () => alert("Coming soon");
  const canEdit = role === "Manager";
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

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

  const startEdit = () => {
    setDraftName(learner.name);
    setDraftDob(learner.dob);
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraftName(learner.name);
    setDraftDob(learner.dob);
    setSaveError("");
    setEditing(false);
  };

  const saveDetails = () => {
    const name = draftName.trim();
    if (!name) {
      setSaveError("Enter the learner's name.");
      return;
    }
    if (!draftDob) {
      setSaveError("Enter the date of birth.");
      return;
    }
    setLearner({ ...learner, name, dob: draftDob });
    setSaveError("");
    setEditing(false);
    setSavedBanner("Learner details saved");
    setTimeout(() => setSavedBanner(""), 2200);
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

      <div className="bg-yellow-300 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(backPath)} className="text-sm text-gray-700 mb-2 flex items-center gap-1 font-medium active:scale-95 transition">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{learner.name}</h1>
          <p className="text-sm text-gray-700">{learner.grade} • {learner.group}</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-32 max-w-lg mx-auto w-full">
        {savedBanner && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {savedBanner}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-green-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-gray-800">{ageFromDob(learner.dob)}</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">Reading Club</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">Art</span>
        </div>

        <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1">
          {["Profile", "Observations", "Attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
                activeTab === tab ? "bg-yellow-300 text-gray-800 shadow-md" : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Learner details</h3>
                {canEdit && !editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
                  >
                    Edit details
                  </button>
                )}
              </div>

              {!editing && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Name</span><span className="font-medium text-right">{learner.name}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Date of birth</span><span className="font-medium">{learner.dob}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Age</span><span className="font-medium">{ageFromDob(learner.dob)}</span></div>
                </div>
              )}

              {editing && (
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-gray-500">Name</span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-500">Date of birth</span>
                    <input
                      type="date"
                      value={draftDob}
                      onChange={(e) => setDraftDob(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </label>
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
                      {saveError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button type="button" onClick={cancelEdit} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg">
                      Cancel
                    </button>
                    <button type="button" onClick={saveDetails} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg">
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

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