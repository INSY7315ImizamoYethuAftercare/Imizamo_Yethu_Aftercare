import { useState } from "react";

export const GRADE_RANGES = ["Gr R", "Gr 1-2", "Gr 3-4", "Gr 5-6", "Gr 7"];

// South African flag colours first, then extra options
export const SA_FLAG_COLOURS = [
  { name: "Gold", hex: "#FFB612" },
  { name: "Green", hex: "#007749" },
  { name: "Red", hex: "#DE3831" },
  { name: "Blue", hex: "#002395" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
];

export const EXTRA_COLOURS = [
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#9B5DE5" },
  { name: "Pink", hex: "#F472B6" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Brown", hex: "#92400E" },
  { name: "Grey", hex: "#9CA3AF" },
];

export const CLASS_COLOURS = [...SA_FLAG_COLOURS, ...EXTRA_COLOURS];

function AddClassSheet({ existingNames, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Gr 1-2");
  const [colour, setColour] = useState(CLASS_COLOURS[0]);
  const [error, setError] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter a class name.");
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return setError("A class with that name already exists.");
    }
    onAdd({ name: trimmed, grade, colour });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Add New Classroom</h2>
        <p className="text-xs text-gray-500 mb-4">Create a new class group for your learners</p>

        <label className="text-[11px] font-semibold text-gray-500 tracking-wide">CLASS NAME <span className="text-red-500">*</span></label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Ladybirds, Comets"
          className="w-full mt-1 mb-1 px-4 py-3 rounded-xl bg-[#F5F0EA] text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mt-3 mb-2">GRADE RANGE <span className="text-red-500">*</span></p>
        <div className="flex flex-wrap gap-2 mb-4">
          {GRADE_RANGES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                grade === g ? "bg-[#2B2A44] text-white" : "bg-[#F5F0EA] text-gray-500 hover:bg-gray-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">CLASS COLOUR</p>
        <div className="flex flex-wrap gap-3 mb-4">
          {CLASS_COLOURS.map((c) => (
            <button
              key={c.hex}
              type="button"
              aria-label={c.name}
              title={c.name}
              onClick={() => setColour(c)}
              style={{ backgroundColor: c.hex }}
              className={`w-12 h-12 rounded-2xl border border-gray-300 transition active:scale-95 ${
                colour.hex === c.hex ? "ring-2 ring-offset-2 ring-orange-400 scale-105" : ""
              }`}
            ></button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 mb-5">
          <span className="text-xl">🏫</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{name.trim() || "Class Name"}</p>
            <p className="text-xs text-orange-400">{grade}</p>
          </div>
          <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colour.hex }}></span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Add Classroom</button>
        </div>
      </div>
    </div>
  );
}

export default AddClassSheet;