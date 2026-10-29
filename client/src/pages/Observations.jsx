import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
import { longDate } from "../utils/dates";
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
  const [activeTab, setActiveTab] = useState("Profile");
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Academic");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(null); // 1-10, required by the server
  const [obsError, setObsError] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState("");
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftDob, setDraftDob] = useState("");
  const [draftClassId, setDraftClassId] = useState("");
  const classes = useClasses();
  const { displayName, displayRole } = useHeader();

  // Real attendance, recent days, pickups and observations for this learner
  // (GET /api/learners/:id/overview). null until loaded.
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const loadOverview = useCallback(async () => {
    if (!learnerId) return;
    try {
      setOverview(await apiClient.get(`/learners/${learnerId}/overview`));
      setOverviewError("");
    } catch (e) {
      setOverviewError(e?.message || "Couldn't load this learner's records.");
    }
  }, [learnerId]);
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);
  const observations = overview?.observations ?? [];

  // The original five classes have a theme; a class added with its own
  // colour (e.g. "Brown" in purple) is painted with that colour instead.
  const customColour = learner?.classColour ?? (CLASS_THEMES[learner?.group] ? null : "#9CA3AF");
  const theme = customColour
    ? { banner: "", tabActive: "", back: "border-black/20 text-gray-900", style: { backgroundColor: customColour } }
    : { ...(CLASS_THEMES[learner?.group] || CLASS_THEMES.Yellow), style: undefined };
  const canEdit = role === "Manager";
  // Only teachers can record observations (the API is teacher-only).
  const canObserve = role === "Teacher";
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

  const closeForm = () => {
    setShowForm(false);
    setNote("");
    setRating(null);
    setSelectedCategory("Academic");
    setObsError("");
  };

  const handleSave = async () => {
    if (!note.trim()) { setObsError("Write your observation first."); return; }
    if (!rating) { setObsError("Choose a rating from 1 to 10."); return; }
    setSavingObs(true);
    setObsError("");
    try {
      await apiClient.post("/observations", { learnerId, category: selectedCategory, rating, notes: note.trim() });
      closeForm();
      await loadOverview();
    } catch (e) {
      setObsError(e?.message || "Couldn't save the observation. Please try again.");
    } finally {
      setSavingObs(false);
    }
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
    return <div className="min-h-screen bg-cream flex items-center justify-center text-gray-400 text-sm">Loading learner...</div>;
  }

  if (!learner) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-500 text-sm">Couldn't find that learner.</p>
        <button onClick={() => navigate(backPath)} className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold">
          Back to Learners
        </button>
      </div>
    );
  }

  // Same widths as the Learners, Attendance and Home pages.
  const shell = "max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
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

      <div className={`${theme.banner} px-4 py-4`} style={theme.style}>
        <div className={`${shell} relative flex items-center justify-center min-h-[48px]`}>
          {/* A soft white pill that sits on any class colour, like the Back
              button on the Settings page. */}
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white/80 border border-white text-sm font-medium text-gray-700 shadow-sm hover:bg-white active:scale-95 transition"
          >
            ← Back
          </button>
          <div className="text-center px-20">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{learner.name}</h1>
            <p className="text-xs text-gray-700">{learner.grade} • {learner.group}</p>
          </div>
        </div>
      </div>

      <div className={`flex-1 px-4 pt-4 pb-32 ${shell}`}>
        {savedBanner && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {savedBanner}
          </div>
        )}

        {overviewError && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {overviewError}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`${card} text-center`}>
            {/* Present days out of days marked, over the last 30 days. */}
            <p className="text-xl font-bold text-green-500">
              {overview?.attendance.percent != null ? `${overview.attendance.percent}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-gray-800">{ageFromDob(learner.dateOfBirth)}</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-xl font-bold text-orange-500">{overview ? observations.length : "—"}</p>
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

            {/* Who may collect this learner. Names and relationships only, no
                contact details (POPIA), as on the Sign-Out page. */}
            <div className={card}>
              <h3 className="font-semibold text-gray-900 mb-3">Parents, guardians &amp; pickups</h3>
              {!overview && !overviewError && <p className="text-sm text-gray-400">Loading…</p>}
              {overview && overview.pickups.length === 0 && (
                <p className="text-sm text-gray-500">No one is on this learner&apos;s pickup list yet.</p>
              )}
              {overview && overview.pickups.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {overview.pickups.map((p) => (
                    <li key={p.guardianId} className="flex items-center justify-between gap-3">
                      <span className="text-gray-800">👤 {p.fullName}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        {p.isPrimaryContact && (
                          <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">Primary contact</span>
                        )}
                        <span className="text-xs text-gray-500">{p.relationship}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {overview && (
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  {overview.canWalkHomeAlone ? "✅ Allowed to walk home alone" : "🚫 Not allowed to walk home alone"}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "Observations" && (
          <>
            {canObserve && !showForm && (
              <button onClick={() => setShowForm(true)} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold mb-6 shadow-lg hover:bg-orange-500 active:scale-[0.98] transition">
                + Add Observation
              </button>
            )}
            {canObserve && showForm && (
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
                  aria-label="Observation"
                  className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm mb-4 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                <p className="text-xs font-medium text-gray-500 mb-2">RATING (1 = needs support, 10 = excellent)</p>
                <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Rating">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={rating === n}
                      onClick={() => setRating(n)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold border transition active:scale-95 ${
                        rating === n ? "bg-orange-400 text-white border-orange-400 shadow-md" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {obsError && (
                  <div role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">{obsError}</div>
                )}
                <div className="flex gap-3">
                  <button onClick={closeForm} disabled={savingObs} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg active:scale-[0.98] transition disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={savingObs} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition disabled:opacity-50">
                    {savingObs ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
            {!overview && !overviewError && <p className="text-sm text-gray-400 text-center py-6">Loading observations…</p>}
            {overview && observations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No observations recorded yet.</p>
            )}
            <div className="space-y-4">
              {observations.map((obs) => (
                <div key={obs.observationId} className={card}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${getCategoryColour(obs.category)}`}>{obs.category}</span>
                    <span className="text-xs text-gray-400">{longDate(obs.date)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{obs.notes || "No notes."}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>— {obs.teacherName ?? "Unknown teacher"}</span>
                    {obs.rating != null && <span className="font-semibold text-gray-500">{obs.rating}/10</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "Attendance" && (
          <div className={card}>
            <h3 className="font-semibold text-gray-900">Recent attendance</h3>
            {overview && (
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Present {overview.attendance.presentDays} of {overview.attendance.markedDays} marked days in the last{" "}
                {overview.attendance.periodDays} days
              </p>
            )}
            {!overview && !overviewError && <p className="text-sm text-gray-400 mt-3">Loading…</p>}
            {overview && overview.recent.length === 0 && (
              <p className="text-sm text-gray-500">No attendance recorded in the last {overview.attendance.periodDays} days.</p>
            )}
            {overview && overview.recent.length > 0 && (
              <ul className="space-y-3">
                {overview.recent.map((day) => {
                  const present = day.status === "present";
                  const detail = !present
                    ? "Absent"
                    : day.signedOut
                      ? day.signedOut.collectedBy === "Walked home alone"
                        ? `Walked home alone at ${day.signedOut.timeOut}`
                        : `Signed out by ${day.signedOut.collectedBy} at ${day.signedOut.timeOut}`
                      : `Present${day.timeIn ? ` (arrived ${day.timeIn})` : ""} • not signed out`;
                  return (
                    <li key={day.date} className="flex items-center gap-3 text-sm">
                      <span className={present ? "text-green-500" : "text-red-500"} aria-hidden="true">{present ? "✓" : "✗"}</span>
                      <div>
                        <p className="text-gray-800 font-medium">{longDate(day.date)}</p>
                        <p className="text-gray-500 text-xs">{detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Observations;