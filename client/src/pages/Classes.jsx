import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import AddClassSheet, { colourForClass, UNASSIGNED_GRADE } from "./AddClassSheet";
import EditClassSheet from "./EditClassSheet.jsx";
import { addClass, removeClass, updateClassGrade, assignTeacher, learnerCount, useClasses, useClassesLoading } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { getLearners, moveLearners, refreshLearners } from "./UseLearners";

function Classes({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const isManager = role === "Manager";
  const { displayName, displayRole } = useHeader();
  const learnersPath = isManager ? "/manager/learners" : "/learners";
  const shell = isManager ? "max-w-5xl mx-auto w-full" : "max-w-lg mx-auto w-full";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  // Both teacher and manager see every class but only managers can add or remove them.
  const classes = useClasses();
  const loadingClasses = useClassesLoading();
  const [showAdd, setShowAdd] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const blockedBy = toRemove ? learnerCount(toRemove) : 0;
  // Learners still in the class being removed (active or deactivated), and
  // where the manager wants them moved before the class goes.
  const otherClasses = toRemove ? classes.filter((c) => c.id !== toRemove.id) : [];
  const [moveTo, setMoveTo] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");

  // Throws if the server refuses (the sheet shows the message and stays open).
  const handleAdd = async ({ name, grade, colour }) => {
    await addClass({ name, grade, colour });
    setShowAdd(false);
  };

  const handleEdit = (grade, teacher) => {
    if (grade !== toEdit.grade) updateClassGrade(toEdit.name, grade);
    if (teacher !== toEdit.teacher) assignTeacher(toEdit.name, teacher);
    setToEdit(null);
  };

  const gradeLabel = (grade) => (grade === UNASSIGNED_GRADE ? "No grade assigned" : grade);

  const startRemove = (cls) => {
    setMoveTo("");
    setMoveError("");
    setToRemove(cls);
  };

  const closeRemove = () => {
    if (!moving) setToRemove(null);
  };

  const confirmRemove = () => {
    removeClass(toRemove.name);
    setToRemove(null);
  };

  // Move every learner to the chosen class, then remove the now-empty class.
  // If a move fails the class is kept, so nobody is left in a removed class.
  const moveAndRemove = async () => {
    const target = otherClasses.find((c) => String(c.id) === moveTo);
    if (!target) { setMoveError("Choose the class to move them to."); return; }
    setMoving(true);
    setMoveError("");
    try {
      // Read the latest list, so nobody added since the page loaded is missed.
      await refreshLearners();
      const ids = getLearners().filter((l) => l.classId === toRemove.id).map((l) => l.id);
      await moveLearners(ids, target.id);
    } catch (e) {
      setMoveError(e?.message || "Couldn't move the learners. Please try again.");
      setMoving(false);
      return;
    }
    const removed = await removeClass(toRemove.name);
    setMoving(false);
    if (removed) setToRemove(null);
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
          {isManager && (
            <button onClick={() => navigate("/settings")} className={iconBtn}>⚙️</button>
          )}
          <MoreMenu />
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Classes <span>🏫</span></h1>
            <p className="text-sm text-gray-500 mt-1">{classes.length} class group{classes.length === 1 ? "" : "s"}</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-orange-600 active:scale-95 transition"
            >
              + Add Class
            </button>
          )}
        </div>

        {loadingClasses && classes.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Loading classes...</p>
        )}

        <div className="space-y-3">
          {classes.map((cls) => {
            const open = () => navigate(`${learnersPath}?group=${cls.name}`);
            return (
              <div
                key={cls.name}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e) => e.key === "Enter" && open()}
                className="w-full bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-lg border border-gray-200 text-left hover:border-orange-300 active:scale-[0.98] transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-10 rounded-full border border-gray-300"
                    style={{ backgroundColor: colourForClass(cls.name, cls.colour) }}
                  ></span>
                  <div>
                    <p className="font-semibold text-gray-900">{cls.name}</p>
                    <p className="text-xs text-gray-500">{gradeLabel(cls.grade)} • {cls.teacher}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{cls.present}</p>
                    <p className="text-xs text-gray-400">present</p>
                  </div>
                  {isManager && (
                    <button
                      type="button"
                      aria-label={`Edit ${cls.name}`}
                      onClick={(e) => { e.stopPropagation(); setToEdit(cls); }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-100 active:scale-95 transition"
                    >
                      ✏️
                    </button>
                  )}
                  {isManager && (
                    <button
                      type="button"
                      aria-label={`Remove ${cls.name}`}
                      onClick={(e) => { e.stopPropagation(); startRemove(cls); }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isManager && showAdd && (
        <AddClassSheet
          existingNames={classes.map((c) => c.name)}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {isManager && toEdit && (
        <EditClassSheet
          cls={toEdit}
          classes={classes}
          onSave={handleEdit}
          onClose={() => setToEdit(null)}
        />
      )}

      {isManager && toRemove && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeRemove}>
          <div role="dialog" aria-label={`Remove ${toRemove.name}`} className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>

            {blockedBy > 0 ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 text-center">Remove {toRemove.name}?</h2>
                <p className="text-sm text-gray-500 text-center mt-2 mb-4">
                  {blockedBy} learner{blockedBy === 1 ? " is" : "s are"} still in this class. Move them to another class first.
                </p>
                {otherClasses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mb-5">There's no other class to move them to. Add a class first.</p>
                ) : (
                  <label className="block text-sm mb-4">
                    <span className="text-gray-500">Move {blockedBy === 1 ? "them" : `all ${blockedBy}`} to</span>
                    <select
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      disabled={moving}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="">Choose a class</option>
                      {otherClasses.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name} ({gradeLabel(c.grade)})</option>
                      ))}
                    </select>
                  </label>
                )}
                {moveError && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-4">{moveError}</div>}
                <div className="flex gap-3">
                  <button onClick={closeRemove} disabled={moving} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition disabled:opacity-50">Cancel</button>
                  {otherClasses.length > 0 && (
                    <button onClick={moveAndRemove} disabled={moving || !moveTo} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition disabled:opacity-50">
                      {moving ? "Moving..." : "Move & remove"}
                    </button>
                  )}
                </div>
                <button onClick={() => navigate(`${learnersPath}?group=${toRemove.name}`)} disabled={moving} className="w-full mt-3 text-xs font-semibold text-orange-500 underline">
                  Or view the learners and move them one by one
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 text-center">Remove Class?</h2>
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 my-4">
                  <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colourForClass(toRemove.name, toRemove.colour) }}></span>
                  <p className="text-sm font-semibold text-gray-900">{toRemove.name} ({toRemove.grade})</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={closeRemove} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
                  <button onClick={confirmRemove} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Remove</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;