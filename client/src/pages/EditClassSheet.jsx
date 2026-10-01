import { useState } from "react";
import { GRADE_RANGES, UNASSIGNED_GRADE, colourForClass } from "./AddClassSheet";

// Lets a manager change which grade a class is assigned to, or mark it as
// not assigned to any grade. The class colour/name itself can't be changed.
const GRADE_OPTIONS = [...GRADE_RANGES, UNASSIGNED_GRADE];

function EditClassSheet({ cls, onSave, onClose }) {
  const [grade, setGrade] = useState(cls.grade);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Edit Classroom</h2>
        <p className="text-xs text-gray-500 mb-4">Change which grade this class is assigned to.</p>

        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 mb-4">
          <span className="text-xl">🏫</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
            <p className="text-xs text-orange-400">{grade === UNASSIGNED_GRADE ? "No grade assigned" : grade}</p>
          </div>
          <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colourForClass(cls.name) }}></span>
        </div>

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">GRADE RANGE</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                grade === g ? "bg-[#2B2A44] text-white" : "bg-[#F5F0EA] text-gray-500 hover:bg-gray-200"
              }`}
            >
              {g === UNASSIGNED_GRADE ? "Not assigned" : g}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
          <button onClick={() => onSave(grade)} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Save</button>
        </div>
      </div>
    </div>
  );
}

export default EditClassSheet;