import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
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

  const [selectedClass, setSelectedClass] = useState("All");
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

  const presentCount = filtered.filter((l) => statusOf(l.id) === "present").length;
  const absentCount = filtered.filter((l) => statusOf(l.id) === "absent").length;

  const setStatus = (id, status) => {
    setMessage(null);
    setMarks((prev) => ({ ...prev, [id]: status }));
  };

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

  const shell = role === "Teacher" ? "max-w-lg mx-auto w-full" : "max-w-5xl mx-auto w-full";

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
            {filtered.length} learners{canEdit ? "" : " • view only"}
          </p>
        </div>

        <div className="flex gap-2 mt-4 mb-5 overflow-x-auto py-2">
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

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 text-center">
            <p className="text-2xl font-bold text-green-500">{presentCount}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {loadError && (
            <p className="text-sm text-red-500 text-center py-2">
              Could not load today&apos;s saved attendance. Check your connection and refresh.
            </p>
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No learners in this class yet.</p>
          )}
          {filtered.map((learner) => (
            <div key={learner.id} className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
                </div>
              </div>
              {canEdit ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(learner.id, "present")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold shadow-md border transition active:scale-95 ${
                    statusOf(learner.id) === "present"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus(learner.id, "absent")}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold shadow-md border transition active:scale-95 ${
                    statusOf(learner.id) === "absent"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Absent
                </button>
              </div>
              ) : (
                <p
                  className={`text-sm font-semibold ${
                    statusOf(learner.id) === "present"
                      ? "text-green-600"
                      : statusOf(learner.id) === "absent"
                        ? "text-red-500"
                        : "text-gray-400"
                  }`}
                >
                  {statusOf(learner.id) === "present"
                    ? "Present"
                    : statusOf(learner.id) === "absent"
                      ? "Absent"
                      : "Not marked yet"}
                </p>
              )}
            </div>
          ))}
        </div>

        {message && (
          <div
            className={`mb-4 border text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg ${
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
  );
}

export default Attendance;