import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useHeader } from "./UseHeader";
import { useLearners, useLearnersLoading, fetchLearnerById, updateLearnerDetails } from "./UseLearners";
import { useClasses } from "./UseClasses";

const CLASS_THEMES = {
  Yellow: { banner: "bg-yellow-300", tabActive: "bg-yellow-300", back: "bg-yellow-400 border-yellow-600 text-yellow-950" },
  Green:  { banner: "bg-green-300",  tabActive: "bg-green-300",  back: "bg-green-500 border-green-700 text-white" },
  Red:    { banner: "bg-red-300",    tabActive: "bg-red-300",    back: "bg-red-400 border-red-600 text-white" },
  Blue:   { banner: "bg-sky-300",    tabActive: "bg-sky-300",    back: "bg-sky-500 border-sky-700 text-white" },
  Orange: { banner: "bg-orange-300", tabActive: "bg-orange-300", back: "bg-orange-500 border-orange-700 text-white" },
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
  const learnerId = Number(searchParams.get("id"));

  // --- Resolve the learner: shared list first, direct fetch as fallback ---
  const allLearners = useLearners();
  const loadingList = useLearnersLoading();
  const learnerFromList = allLearners.find((l) => l.id === learnerId);

  const [directLearner, setDirectLearner] = useState(null);
  const [directLoading, setDirectLoading] = useState(false);

  useEffect(() => {
    if (learnerFromList || !learnerId) return;
    let cancelled = false;
    setDirectLoading(true);
    fetchLearnerById(learnerId)
      .then((l) => { if (!cancelled) setDirectLearner(l); })
      .finally(() => { if (!cancelled) setDirectLoading(false); });
    return () => { cancelled = true; };
  }, [learnerFromList, learnerId]);

  const learner = learnerFromList || directLearner;
  // Once the learner is in the list we're done, even if the direct fetch was
  // cancelled mid-way (it then never clears directLoading).
  const stillLoading = !learnerFromList && (loadingList || directLoading);

  // --- Every hook below runs unconditionally, before any early return ---
  const [activeTab, setActiveTab] = useState("Observations");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState("");
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftDob, setDraftDob] = useState("");
  const [draftClassId, setDraftClassId] = useState("");
  const classes = useClasses();
  const [observations, setObservations] = useState([
    { id: 1, category: "Social", date: "2025-07-15", note: "Showed great leadership during group activity today.", teacher: "Ms Nkosi" },
    { id: 2, category: "Academic", date: "2025-07-08", note: "Reading fluency improving significantly. Completed level 3 book.", teacher: "Ms Nkosi" },
  ]);
  const { displayName, displayRole } = useHeader();

  // The original five classes have a theme; a class added with its own
  // colour (e.g. "Brown" in purple) is painted with that colour instead.
  const customColour = learner?.classColour ?? (CLASS_THEMES[learner?.group] ? null : "#9CA3AF");
  const theme = customColour
    ? { banner: "", tabActive: "", back: "border-black/20 text-gray-900", style: { backgroundColor: customColour } }
    : { ...(CLASS_THEMES[learner?.group] || CLASS_THEMES.Yellow), style: undefined };
  const canEdit = role === "Manager";
  const comingSoon = () => alert("Coming soon");
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn = "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const backPath = role === "Admin" ? "/admin/learners" : role === "Manager" ? "/manager/learners" : "/learners";
  const categories = ["Academic", "Social", "Wellbeing", "Creative", "Physical"];

  const getCategoryColour = (category) => ({
    Social: "text-cyan-500", Academic: "text-blue-500", Wellbeing: "text-green-500",
    Creative: "text-pink-500", Physical: "text-purple-500",
  }[category] || "text-gray-500");

  const getCategoryBg = (category) => ({
    Social: "bg-cyan-400 text-white", Academic: "bg-blue-400 text-white", Wellbeing: "bg-green-400 text-white",
    Creative: "bg-pink-400 text-white", Physical: "bg-purple-400 text-white",
  }[category] || "bg-gray-200 text-gray-600");

  const handleSave = () => {
    if (!note.trim()) return;
    setObservations([
      { id: Date.now(), category: selectedCategory, date: new Date().toISOString().split("T")[0], note, teacher: displayName },
      ...observations,
    ]);
    setNote("");
    setSelectedCategory("Academic");
    setShowForm(false);
  };

  const startEdit = () => {
    setDraftFirstName(learner.firstName);
    setDraftLastName(learner.lastName);
    setDraftDob(learner.dateOfBirth ?? "");
    setDraftClassId(String(learner.classId ?? ""));
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => { setSaveError(""); setEditing(false); };

  const saveDetails = async () => {
    const firstName = draftFirstName.trim();
    const lastName = draftLastName.trim();
    if (!firstName || !lastName) { setSaveError("Enter the learner's first and last name."); return; }
    if (!draftDob) { setSaveError("Enter the date of birth."); return; }
    if (!draftClassId) { setSaveError("Choose a class."); return; }

    setSaving(true);
    try {
      await updateLearnerDetails(learner.id, { firstName, lastName, dateOfBirth: draftDob, classId: Number(draftClassId) });
      setSaveError("");
      setEditing(false);
      setSavedBanner("Learner details saved");
      setTimeout(() => setSavedBanner(""), 2200);
    } catch (e) {
      setSaveError(e?.message || "Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  // --- Early returns come after every hook above ---
  if (stillLoading) {
    return <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center text-gray-400 text-sm">Loading learner...</div>;
  }

  if (!learner) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-500 text-sm">Couldn't find that learner.</p>
        <button onClick={() => navigate(backPath)} className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold">
          Back to Learners
        </button>
      </div>
    );
  }

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
          {showSettings && <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>}
          <MoreMenu />
        </div>
      </div>

      <div className={`${theme.banner} px-4 pt-3 pb-12`} style={theme.style}>
        <div className="max-w-lg mx-auto relative flex items-center justify-center min-h-[48px]">
          <button
            onClick={() => navigate(backPath)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full border-2 text-xs font-semibold shadow-md flex items-center gap-1 active:scale-95 transition ${theme.back}`}
            style={theme.style}
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{learner.name}</h1>
            <p className="text-xs text-gray-700">{learner.grade} • {learner.group}</p>
          </div>
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
            <p className="text-xl font-bold text-gray-800">{ageFromDob(learner.dateOfBirth)}</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {[{ label: "Profile", icon: "👤" }, { label: "Observations", icon: "📝" }, { label: "Attendance", icon: "✅" }].map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold shadow-md transition active:scale-[0.97] ${
                activeTab === label ? `${theme.tabActive} text-gray-800` : "bg-gray-100 text-gray-500"
              }`}
              style={activeTab === label ? theme.style : undefined}
            >
              <span className="mr-1">{icon}</span>{label}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Learner details</h3>
                {canEdit && !editing && (
                  <button type="button" onClick={startEdit} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition">
                    Edit details
                  </button>
                )}
              </div>

              {!editing && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Name</span><span className="font-medium text-right">{learner.name}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Class</span><span className="font-medium text-right">{learner.group} ({learner.grade})</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Date of birth</span><span className="font-medium">{learner.dateOfBirth ?? "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Age</span><span className="font-medium">{ageFromDob(learner.dateOfBirth)}</span></div>
                </div>
              )}

              {editing && (
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-gray-500">First name</span>
                    <input type="text" value={draftFirstName} onChange={(e) => setDraftFirstName(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-500">Last name</span>
                    <input type="text" value={draftLastName} onChange={(e) => setDraftLastName(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-500">Date of birth</span>
                    <input type="date" value={draftDob} onChange={(e) => setDraftDob(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-500">Class</span>
                    <select value={draftClassId} onChange={(e) => setDraftClassId(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300">
                      {/* The learner's current class stays selectable even if the list hasn't loaded yet. */}
                      {!classes.some((c) => String(c.id) === String(learner.classId)) && (
                        <option value={String(learner.classId ?? "")}>{learner.group}</option>
                      )}
                      {classes.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name} ({c.grade})</option>
                      ))}
                    </select>
                  </label>
                  {saveError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">{saveError}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={cancelEdit} disabled={saving} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="button" onClick={saveDetails} disabled={saving} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
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
              <button onClick={() => setShowForm(true)} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold mb-6 shadow-lg hover:bg-orange-500 active:scale-[0.98] transition">
                + Add Observation
              </button>
            )}
            {showForm && (
              <div className={`${card} mb-6`}>
                <h2 className="font-semibold text-gray-900 mb-3">New Observation</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-md active:scale-95 transition ${selectedCategory === cat ? getCategoryBg(cat) : "bg-gray-100 text-gray-500"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write your observation here..."
                  className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm mb-4 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
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