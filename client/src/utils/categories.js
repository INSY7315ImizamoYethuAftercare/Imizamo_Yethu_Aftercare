// The development categories and their colours, defined once so the teacher's
// Observations page and the Reports charts always match. The class names are
// written out in full so Tailwind can see them.
export const CATEGORIES = ["Academic", "Social", "Wellbeing", "Creative", "Physical"];

const COLOURS = {
  Academic: { text: "text-blue-500", chip: "bg-blue-400 text-white", hex: "#3B82F6" },
  Social: { text: "text-cyan-500", chip: "bg-cyan-400 text-white", hex: "#06B6D4" },
  Wellbeing: { text: "text-green-500", chip: "bg-green-400 text-white", hex: "#22C55E" },
  Creative: { text: "text-pink-500", chip: "bg-pink-400 text-white", hex: "#EC4899" },
  Physical: { text: "text-purple-500", chip: "bg-purple-400 text-white", hex: "#A855F7" },
};

/** Coloured text for a category name (e.g. a category label in a list). */
export const categoryTextClass = (category) => COLOURS[category]?.text ?? "text-gray-500";

/** Filled chip (background and white text) for a category. */
export const categoryChipClass = (category) => COLOURS[category]?.chip ?? "bg-gray-200 text-gray-600";

/** The category's colour as a hex value, for charts and PDFs. */
export const categoryHex = (category) => COLOURS[category]?.hex ?? "#94A3B8";
