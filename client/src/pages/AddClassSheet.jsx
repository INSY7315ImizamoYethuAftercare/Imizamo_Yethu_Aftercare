import { useState } from "react";

export const GRADE_RANGES = ["Gr R", "Gr 1-2", "Gr 3-4", "Gr 5-6", "Gr 7"];
export const UNASSIGNED_GRADE = "Unassigned";

// A class's colour is the actual name of the class, so this list drives both both the colour and class name
export const CLASS_COLOURS = [
  { name: "Yellow", hex: "#FDE047" },
  { name: "Green", hex: "#86EFAC" },
  { name: "Red", hex: "#FCA5A5" },
  { name: "Blue", hex: "#7DD3FC" },
  { name: "Orange", hex: "#FDBA74" },
];

export const colourForClass = (name) =>
  CLASS_COLOURS.find((c) => c.name.toLowerCase() === name.toLowerCase())?.hex ?? "#9CA3AF";

function AddClassSheet({ existingNames, onAdd, onClose }) {
  const taken = existingNames.map((n) => n.toLowerCase());
  const available = CLASS_COLOURS.filter((c) => !taken.includes(c.name.toLowerCase()));

  const [colour, setColour] = useState(available[0] ?? null);
  const [grade, setGrade] = useState("Gr 1-2");
  const [error, setError] = useState("");

  const submit = () => {
    if (!colour) return setError("All five classes already exist.");
    onAdd({ name: colour.name, grade });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Add New Classroom</h2>
        <p className="text-xs text-gray-500 mb-4">Pick the class colour. It is also the class name.</p>

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">CLASS COLOUR <span className="text-red-500">*</span></p>
        {available.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">All five classes already exist.</p>
        ) : (
          <div className="flex flex-wrap gap-3 mb-4">
            {available.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => { setColour(c); setError(""); }}
                className="flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <span
                  style={{ backgroundColor: c.hex }}
                  className={`w-12 h-12 rounded-2xl border border-gray-300 ${
                    colour?.name === c.name ? "ring-2 ring-offset-2 ring-orange-400 scale-105" : ""
                  }`}
                ></span>
                <span className="text-[11px] text-gray-500">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">GRADE RANGE <span className="text-red-500">*</span></p>
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

        {colour && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-3 mb-4">
            <span className="text-xl">🏫</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{colour.name}</p>
              <p className="text-xs text-orange-400">{grade}</p>
            </div>
            <span className="w-2 h-8 rounded-full border border-gray-300" style={{ backgroundColor: colour.hex }}></span>
          </div>
        )}
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition">Add Classroom</button>
        </div>
      </div>
    </div>
  );
}

export default AddClassSheet;