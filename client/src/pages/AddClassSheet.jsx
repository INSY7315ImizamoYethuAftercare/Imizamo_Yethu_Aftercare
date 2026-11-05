import { useEffect, useState } from "react";
import { getClasses } from "./UseClasses";
import { useStaff, teachersOnly, NO_TEACHER } from "./UseTeachers";

export const GRADE_RANGES = ["Gr R", "Gr 1-2", "Gr 3-4", "Gr 5-6", "Gr 7"];
export const UNASSIGNED_GRADE = "Unassigned";

// Colours for the five original classes, whose colour is their name. Classes
// created with the Add Classroom form store their own colour instead.
export const CLASS_COLOURS = [
  { name: "Yellow", hex: "#FDE047" },
  { name: "Green", hex: "#86EFAC" },
  { name: "Red", hex: "#FCA5A5" },
  { name: "Blue", hex: "#7DD3FC" },
  { name: "Orange", hex: "#FDBA74" },
];

// The swatches offered when adding a class: pastels like the five original
// classes, in different colours so a new class stands apart from them.
export const SWATCHES = [
  { label: "Teal", hex: "#5EEAD4" },
  { label: "Purple", hex: "#D8B4FE" },
  { label: "Pink", hex: "#F9A8D4" },
  { label: "Periwinkle", hex: "#A5B4FC" },
  { label: "Lime", hex: "#BEF264" },
  { label: "Aqua", hex: "#A5F3FC" },
  { label: "Lilac", hex: "#F0ABFC" },
  { label: "Tan", hex: "#E7C9A9" },
];

const NAME_MAX = 100; // school_classes.class_name

// A class's colour: the one saved with it, else the colour matching its
// name (the original five classes), else grey.
export const colourForClass = (name, colour) =>
  colour ??
  getClasses().find((c) => c.name.toLowerCase() === name?.toLowerCase())?.colour ??
  CLASS_COLOURS.find((c) => c.name.toLowerCase() === name?.toLowerCase())?.hex ??
  "#9CA3AF";

const label = "block text-xs font-bold text-gray-500 tracking-wide mb-2";

function AddClassSheet({ existingNames, classes = [], onAdd, onClose }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Gr 1-2");
  const [colour, setColour] = useState(SWATCHES[0].hex);
  const [teacher, setTeacher] = useState(NO_TEACHER);
  const teachers = teachersOnly(useStaff()).filter((t) => t.status === "Active");
  // The class the picked teacher leads now, so the manager can see they'll be moved.
  const movingFrom = teacher !== NO_TEACHER ? classes.find((c) => c.teacher === teacher)?.name : null;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const trimmed = name.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!trimmed) return setError("Enter a class name.");
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`There's already a class called ${trimmed}.`);
    }
    setSaving(true);
    setError("");
    try {
      await onAdd({ name: trimmed, grade, colour, teacher });
    } catch (err) {
      setError(err?.message || "Couldn't add the class. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => !saving && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-class-title"
        className="w-full max-w-lg bg-white rounded-t-3xl px-6 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit} noValidate>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
          <h2 id="add-class-title" className="text-2xl font-extrabold text-gray-900">Add New Classroom</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Create a new class group for your learners</p>

          <label htmlFor="class-name" className={label}>
            CLASS NAME <span className="text-orange-500">*</span>
          </label>
          <input
            id="class-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            autoFocus
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Brown, White"
            className="w-full mb-6 px-4 py-4 rounded-2xl bg-beige text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />

          <p id="grade-label" className={label}>
            GRADE RANGE <span className="text-orange-500">*</span>
          </p>
          <div role="group" aria-labelledby="grade-label" className="flex flex-wrap gap-2 mb-6">
            {GRADE_RANGES.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={grade === g}
                onClick={() => setGrade(g)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition active:scale-95 ${
                  grade === g ? "bg-orange-400 text-white shadow-md" : "bg-beige text-gray-500 hover:bg-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <p id="teacher-label" className={label}>TEACHER</p>
          <div role="group" aria-labelledby="teacher-label" className="flex flex-wrap gap-2 mb-2">
            {[NO_TEACHER, ...teachers.map((t) => t.name)].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={teacher === n}
                onClick={() => setTeacher(n)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition active:scale-95 ${
                  teacher === n ? "bg-orange-400 text-white shadow-md" : "bg-beige text-gray-500 hover:bg-gray-200"
                }`}
              >
                {n === NO_TEACHER ? "No teacher" : n}
              </button>
            ))}
          </div>
          <p className="text-xs text-orange-500 min-h-[1rem] mb-6">
            {movingFrom ? `${teacher} currently leads ${movingFrom}. Adding this class will move them here.` : ""}
          </p>

          <p id="colour-label" className={label}>CLASS COLOUR</p>
          <div role="group" aria-labelledby="colour-label" className="grid grid-cols-5 gap-3 mb-6">
            {SWATCHES.map((s) => (
              <button
                key={s.hex}
                type="button"
                aria-label={s.label}
                aria-pressed={colour === s.hex}
                onClick={() => setColour(s.hex)}
                style={{ backgroundColor: s.hex }}
                className={`aspect-square rounded-2xl transition active:scale-95 ${
                  colour === s.hex ? "scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-gray-300" : "hover:scale-105"
                }`}
              ></button>
            ))}
          </div>

          {/* Preview of how the class will look in the list. */}
          <div aria-hidden="true" className="flex items-center gap-3 bg-amber-50 border-2 border-amber-100 rounded-2xl px-4 py-4 mb-4">
            <span className="w-12 h-12 rounded-xl bg-amber-100/70 flex items-center justify-center text-xl">🏫</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">{trimmed || "Class Name"}</p>
              <p className="text-xs font-semibold text-gray-500">{grade}</p>
            </div>
            <span className="w-2 h-8 rounded-full" style={{ backgroundColor: colour }}></span>
          </div>

          {error && (
            <p role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-beige text-base font-bold text-gray-500 active:scale-95 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-brand text-base font-bold text-white shadow-md hover:bg-orange-600 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Classroom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClassSheet;
