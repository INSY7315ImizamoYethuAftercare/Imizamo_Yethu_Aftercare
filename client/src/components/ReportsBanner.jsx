// The coloured banner at the top of each report tab, in the same style as the
// home screens, with the tab's one-line takeaway underneath the title.
const ARROWS = { up: "▲", down: "▼", flat: "=" };
const CHIP = {
  up: "bg-green-100 text-green-700",
  down: "bg-red-100 text-red-600",
  flat: "bg-white/90 text-gray-600",
};

function ReportsBanner({ icon, title, subtitle, insight }) {
  const tone = insight?.tone;
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 text-white shadow-lg">
      <span aria-hidden="true" className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/15" />
      <span aria-hidden="true" className="absolute -bottom-12 right-20 w-28 h-28 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-sm opacity-90">{subtitle}</p>
        <h2 className="text-xl md:text-2xl font-bold mt-1 flex items-center gap-2">
          <span aria-hidden="true">{icon}</span> {title}
        </h2>
        {insight && (
          <p className="text-sm mt-2 flex items-start gap-2">
            {ARROWS[tone] && (
              <span aria-hidden="true" className={`shrink-0 mt-0.5 text-[10px] font-bold rounded-full px-2 py-0.5 ${CHIP[tone]}`}>
                {ARROWS[tone]}
              </span>
            )}
            <span className="min-w-0">{insight.text}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default ReportsBanner;
