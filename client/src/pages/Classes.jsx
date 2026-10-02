import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import AddClassSheet, { colourForClass, UNASSIGNED_GRADE } from "./AddClassSheet";
import EditClassSheet from "./EditClassSheet.jsx";
import { addClass, removeClass, updateClassGrade, assignTeacher, learnerCount, useClasses } from "./UseClasses";

function Classes({ role = "Teacher" }) {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const isManager = role === "Manager";
  const displayName = isManager ? "Sarah Botha" : "Ms Nkosi";
  const displayRole = isManager ? "Manager" : "Teacher • Yellow";
  const learnersPath = isManager ? "/manager/learners" : "/learners";
  const shell = isManager ? "max-w-5xl mx-auto w-full" : "max-w-lg mx-auto w-full";

  // Both teacher and manager see every class but only managers can add or remove them.
  const classes = useClasses();
  const [showAdd, setShowAdd] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const blockedBy = toRemove ? learnerCount(toRemove) : 0;

  const handleAdd = ({ name, grade }) => {
    addClass({ name, grade, teacher: "Unassigned", present: "0/0" });
    setShowAdd(false);
  };

  const handleEdit = (grade, teacher) => {
    if (grade !== toEdit.grade) updateClassGrade(toEdit.name, grade);
    if (teacher !== toEdit.teacher) assignTeacher(toEdit.name, teacher);
    setToEdit(null);
  };

  const gradeLabel = (grade) => (grade === UNASSIGNED_GRADE ? "No grade assigned" : grade);

  const confirmRemove = () => {
    removeClass(toRemove.name);
    setToRemove(null);
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
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
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
                    style={{ backgroundColor: colourForClass(cls.name) }}
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
                      onClick={(e) => { e.stopPropagation(); setToRemove(cls); }}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setToRemove(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>

            {blockedBy > 0 ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 text-center">Can't remove {toRemove.name}</h2>
                <p className="text-sm text-gray-500 text-center mt-2 mb-5">
                  {blockedBy} learner{blockedBy === 1 ? " is" : "s are"} still in this class. Move them to another class first.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setToRemove(null)} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Close</button>
                  <button onClick={() => navigate(`${learnersPath}?group=${toRemove.name}`)} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">View learners</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 text-center">Remove Class?</h2>
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 my-4">
                  <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colourForClass(toRemove.name) }}></span>
                  <p className="text-sm font-semibold text-gray-900">{toRemove.name} ({toRemove.grade})</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setToRemove(null)} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
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