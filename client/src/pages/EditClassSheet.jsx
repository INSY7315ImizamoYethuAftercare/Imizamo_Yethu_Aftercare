import { useState } from "react";
import { GRADE_RANGES, UNASSIGNED_GRADE, colourForClass } from "./AddClassSheet";
import { useStaff, teachersOnly, NO_TEACHER } from "./UseTeachers";

// Lets a manager change which grade a class is assigned to and which teacher
// leads it. The class colour/name itself can't be changed.
const GRADE_OPTIONS = [...GRADE_RANGES, UNASSIGNED_GRADE];

function EditClassSheet({ cls, classes = [], onSave, onClose }) {
  const [grade, setGrade] = useState(cls.grade);
  const [teacher, setTeacher] = useState(cls.teacher);

  // Only active teachers can be picked. The class's current teacher stays
  // listed even if suspended so the sheet still shows who is assigned.
  const teachers = teachersOnly(useStaff()).filter((t) => t.status === "Active" || t.name === cls.teacher);

  // Which class (if any) a teacher currently leads, so the manager can see
  // that picking them will move them off that class.
  const currentClassOf = (name) => classes.find((c) => c.teacher === name)?.name;
  const movingFrom = teacher !== NO_TEACHER ? currentClassOf(teacher) : null;
  const showMoveNote = movingFrom && movingFrom !== cls.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Edit Classroom</h2>
        <p className="text-xs text-gray-500 mb-4">Change the grade and the teacher for this class.</p>

        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 mb-4">
          <span className="text-xl">🏫</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
            <p className="text-xs text-orange-400 truncate">
              {grade === UNASSIGNED_GRADE ? "No grade assigned" : grade} • {teacher}
            </p>
          </div>
          <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colourForClass(cls.name, cls.colour) }}></span>
        </div>

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">GRADE RANGE</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                grade === g ? "bg-orange-400 text-white" : "bg-beige text-gray-500 hover:bg-gray-200"
              }`}
            >
              {g === UNASSIGNED_GRADE ? "Not assigned" : g}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">TEACHER</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {[...teachers.map((t) => t.name), NO_TEACHER].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTeacher(name)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                teacher === name ? "bg-orange-400 text-white" : "bg-beige text-gray-500 hover:bg-gray-200"
              }`}
            >
              {name === NO_TEACHER ? "No teacher" : name}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-orange-500 min-h-[1rem] mb-4">
          {showMoveNote ? `${teacher} currently leads ${movingFrom}. Saving will move them to ${cls.name}.` : ""}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-beige text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
          <button onClick={() => onSave(grade, teacher)} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Save</button>
        </div>
      </div>
    </div>
  );
}

export default EditClassSheet;