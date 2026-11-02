import { useState } from "react";
import { useClasses } from "./UseClasses";

export const GRADES = ["Grade R", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"];

const field = "w-full mt-1 mb-3 px-4 py-3 rounded-xl bg-beige text-sm focus:outline-none focus:ring-2 focus:ring-orange-300";
const label = "text-[11px] font-semibold text-gray-500 tracking-wide";

function AddLearnerSheet({ onAdd, onClose }) {
  const classes = useClasses();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) return setError("Please enter the learner's first and last name.");
    if (!classId) return setError("Please pick a class.");
    onAdd({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      classId: Number(classId),
      dateOfBirth,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
        <p className="text-xs text-gray-500 mb-4">Fill in the learner's details below</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>FIRST NAME <span className="text-red-500">*</span></label>
            <input value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(""); }} placeholder="e.g. Aisha" className={field} />
          </div>
          <div>
            <label className={label}>LAST NAME <span className="text-red-500">*</span></label>
            <input value={lastName} onChange={(e) => { setLastName(e.target.value); setError(""); }} placeholder="e.g. Petersen" className={field} />
          </div>
        </div>

        <label className={label}>CLASS <span className="text-red-500">*</span></label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className={field}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
        </select>

        <label className={label}>DATE OF BIRTH (optional)</label>
        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={field} />
        <p className="text-[11px] text-gray-400 -mt-2 mb-3">
          Parents link to a learner through their name and date of birth, so add it when you have it.
        </p>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-beige text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Add Student</button>
        </div>
      </div>
    </div>
  );
}

export default AddLearnerSheet;