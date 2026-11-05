// The development categories and their colours, defined once so the teacher's
// Observations page and the Reports charts always match. The class names are
// written out in full so Tailwind can see them.
export const CATEGORIES = ["Academic", "Social", "Wellbeing", "Creative", "Physical"];

const COLOURS = {
  Academic: { text: "text-blue-600", chip: "bg-blue-100 text-blue-700", hex: "#93C5FD" },
  Social: { text: "text-cyan-600", chip: "bg-cyan-100 text-cyan-700", hex: "#67E8F9" },
  Wellbeing: { text: "text-green-600", chip: "bg-green-100 text-green-700", hex: "#86EFAC" },
  Creative: { text: "text-pink-600", chip: "bg-pink-100 text-pink-700", hex: "#F9A8D4" },
  Physical: { text: "text-purple-600", chip: "bg-purple-100 text-purple-700", hex: "#D8B4FE" },
};

/** Coloured text for a category name (e.g. a category label in a list). */
export const categoryTextClass = (category) => COLOURS[category]?.text ?? "text-gray-500";

/** Soft chip (tinted background and darker text) for a category. */
export const categoryChipClass = (category) => COLOURS[category]?.chip ?? "bg-gray-200 text-gray-600";

/** The category's colour as a hex value, for charts and PDFs. */
export const categoryHex = (category) => COLOURS[category]?.hex ?? "#94A3B8";
