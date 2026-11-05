// One colour per figure, so a number looks the same on every report tab and
// home page: `tint` behind the icon, `text` for the number, `fill` for its bar.
export const STAT_COLOURS = {
  attendance: { tint: "bg-green-50", text: "text-green-600", fill: "bg-green-500" },
  learners: { tint: "bg-pink-50", text: "text-pink-500", fill: "bg-pink-500" },
  classes: { tint: "bg-sky-50", text: "text-sky-600", fill: "bg-sky-500" },
  teachers: { tint: "bg-purple-50", text: "text-purple-600", fill: "bg-purple-500" },
  signOuts: { tint: "bg-orange-50", text: "text-orange-500", fill: "bg-orange-500" },
  observations: { tint: "bg-amber-50", text: "text-amber-600", fill: "bg-amber-500" },
  escalations: { tint: "bg-red-50", text: "text-red-500", fill: "bg-red-500" },
};
