import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { useSession } from "../services/session";
import { colourForClass } from "./AddClassSheet";
import { useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { useLearners } from "./UseLearners";

function Attendance({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const { displayName, displayRole } = useHeader();

  // Teachers take attendance; managers can only look (the database records
  // which teacher took each register, so a manager can't save one).
  const canEdit = role === "Teacher";

  const classList = useClasses();
  const allLearners = useLearners();
  // Only active learners appear on the register.
  const learners = allLearners.filter((l) => l.status === "active");

  // A teacher opens on the class they lead (same rule as the header's
  // "Teacher • Yellow"); managers, and teachers without a class, open on All.
  // `chosenClass` stays null until someone taps a filter, so the default can
  // follow the class list once it has loaded.
  const { user } = useSession();
  const myClass = canEdit ? classList.find((c) => c.teacher === user?.fullName) : null;
  const [chosenClass, setSelectedClass] = useState(null);
  const selectedClass = chosenClass ?? myClass?.name ?? "All";
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState({}); // learnerId -> { recordId, status } from the server
  const [marks, setMarks] = useState({}); // learnerId -> unsaved choice made on this screen
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [loadError, setLoadError] = useState(false);

  const classIds = classList.map((c) => c.id).join(",");

  // Today's saved attendance for every class (the API is per class).
  const loadAttendance = useCallback(async () => {
    const ids = classIds ? classIds.split(",") : [];
    if (ids.length === 0) return;
    try {
      const lists = await Promise.all(ids.map((id) => apiClient.get(`/attendance/class/${id}`)));
      const next = {};
      for (const r of lists.flat()) next[r.learner_id] = { recordId: r.record_id, status: r.status };
      setSaved(next);
      setLoadError(false);
    } catch (e) {
      console.error("Could not load attendance:", e);
      setLoadError(true);
    }
  }, [classIds]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const statusOf = (id) => marks[id] ?? saved[id]?.status ?? null;

  const classes = ["All", ...classList.map((c) => c.name)];

  const filtered =
    selectedClass === "All"
      ? learners
      : learners.filter((l) => l.group === selectedClass);

  // Search only narrows what's shown. Counts and saving still cover the whole
  // class, so marks made before searching aren't dropped from the save.
  const query = search.trim().toLowerCase();
  const visible = query ? filtered.filter((l) => l.name.toLowerCase().includes(query)) : filtered;

  const presentCount = filtered.filter((l) => statusOf(l.id) === "present").length;
  const absentCount = filtered.filter((l) => statusOf(l.id) === "absent").length;

  const setStatus = (id, status) => {
    setMessage(null);
    setMarks((prev) => ({ ...prev, [id]: status }));
  };

  // Class view shortcuts. "All present" marks everyone currently shown;
  // "Clear" undoes unsaved choices for this class (saved records stay).
  const markAllPresent = () => {
    setMessage(null);
    setMarks((prev) => {
      const next = { ...prev };
      for (const l of visible) next[l.id] = "present";
      return next;
    });
  };
  const clearMarks = () => {
    setMessage(null);
    setMarks((prev) => {
      const next = { ...prev };
      for (const l of filtered) delete next[l.id];
      return next;
    });
  };

  const isClassView = selectedClass !== "All";
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  // Only learners whose choice differs from what is already saved.
  const pending = filtered.filter((l) => marks[l.id] && marks[l.id] !== saved[l.id]?.status);

  const handleSave = async () => {
    if (pending.length === 0) {
      setMessage({ type: "error", text: "Nothing new to save. Mark learners present or absent first." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const results = await Promise.allSettled(
      pending.map((l) =>
        saved[l.id]
          ? apiClient.patch(`/attendance/${saved[l.id].recordId}`, { status: marks[l.id] })
          : apiClient.post("/attendance", { learnerId: l.id, classId: l.classId, status: marks[l.id] }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected");
    const succeeded = pending.filter((_, i) => results[i].status === "fulfilled");

    // Drop the unsaved marks that did save; keep the ones that failed so they can retry.
    setMarks((prev) => {
      const next = { ...prev };
      for (const l of succeeded) delete next[l.id];
      return next;
    });
    await loadAttendance();
    dataBus.emit("classes"); // refresh the "present today" counts on the Classes page

    if (failed.length === 0) {
      setMessage({ type: "success", text: "Attendance saved" });
      setTimeout(() => setMessage(null), 2500);
    } else {
      const reason = failed[0].reason?.message || "Something went wrong.";
      setMessage({
        type: "error",
        text: `${failed.length} of ${pending.length} could not be saved. ${reason}`,
      });
    }
    setSaving(false);
  };

  // One column of learner cards at every size, the same width as the
  // Learners page so the two look alike.
  const shell = "max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full";

  const pill = (active, on) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold border transition active:scale-95 ${
      active ? on : "bg-white text-gray-500 border-transparent hover:border-gray-200"
    }`;

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
          {showSettings && (
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          )}
          <MoreMenu />
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Attendance <span>✓</span></h1>
          <p className="text-sm text-gray-500 mt-1">
            <span>{today}</span> • <span>{filtered.length} learners{canEdit ? "" : " • view only"}</span>
          </p>
        </div>

        <input
          type="text"
          aria-label="Search learner name"
          placeholder="Search learner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-4 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <div className="flex gap-2 mt-3 mb-5 overflow-x-auto py-2">
          {classes.map((cls) => {
            const isActive = selectedClass === cls;
            const classColour = cls === "All" ? "#FB923C" : colourForClass(cls);
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                style={
                  isActive
                    ? { backgroundColor: classColour, borderColor: classColour, color: "#1f2937" }
                    : { backgroundColor: "#ffffff", borderColor: "#e5e7eb", color: "#4b5563" }
                }
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-md border transition active:scale-95"
              >
                {cls}
              </button>
            );
          })}
        </div>

        {/* "present / total" summary (Figma). In a class it's tinted in the
            class colour (light, so the text stays dark); for All it's white
            with an orange border, so it isn't mistaken for the Orange class
            (which has a tinted background). All ✓ /
            Clear only in a single class, so nobody marks the whole centre
            present by accident. */}
        {(() => {
          const tint = isClassView ? colourForClass(selectedClass) : null;
          return (
          <div
            data-testid="class-summary"
            style={
              tint
                ? { backgroundColor: `color-mix(in srgb, ${tint} 30%, white)`, borderColor: tint }
                : { backgroundColor: "#ffffff", borderColor: "#FB923C" }
            }
            className="rounded-2xl p-4 shadow-lg border-2 mb-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {presentCount} / {filtered.length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                learners present
                {absentCount > 0 && <span className="text-red-600 font-semibold"> • {absentCount} absent</span>}
              </p>
            </div>
            {isClassView && canEdit && filtered.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Mark all present"
                  onClick={markAllPresent}
                  className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold shadow-md transition active:scale-95"
                >
                  All ✓
                </button>
                <button
                  type="button"
                  onClick={clearMarks}
                  className="px-3 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-white/60 transition active:scale-95"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          );
        })()}

        {loadError && (
          <p className="text-sm text-red-500 text-center py-2">
            Could not load today&apos;s saved attendance. Check your connection and refresh.
          </p>
        )}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No learners in this class yet.</p>
        )}
        {filtered.length > 0 && visible.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No learners match &ldquo;{search.trim()}&rdquo;.</p>
        )}

        {visible.length > 0 && (
          // Same card style as the Learners page: one white card per learner.
          <ul className="space-y-3 mb-6">
            {visible.map((learner) => {
              const status = statusOf(learner.id);
              return (
                <li
                  key={learner.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{learner.name}</p>
                    {/* In a class view the class name is already in the pill. */}
                    <p className="text-xs text-gray-500">
                      {isClassView ? learner.grade : `${learner.grade} • ${learner.group}`}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setStatus(learner.id, "present")}
                        aria-pressed={status === "present"}
                        className={pill(status === "present", "bg-green-500 text-white border-green-500 shadow-md")}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(learner.id, "absent")}
                        aria-pressed={status === "absent"}
                        className={pill(status === "absent", "bg-red-500 text-white border-red-500 shadow-md")}
                      >
                        Absent
                      </button>
                    </div>
                  ) : (
                    <p
                      className={`text-sm font-semibold shrink-0 ${
                        status === "present" ? "text-green-600" : status === "absent" ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      {status === "present" ? "Present" : status === "absent" ? "Absent" : "Not marked yet"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Sticky so the save button stays on screen while scrolling a long
            register. On phones it sits above the floating bottom nav; from md
            up the nav is a sidebar, so it can sit near the bottom edge. */}
        <div className={canEdit ? "sticky bottom-24 md:bottom-4 z-30" : ""}>
          {message && (
            <div
              className={`mb-3 border text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;