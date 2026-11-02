import ReportsBanner from "./ReportsBanner";

const SECTIONS = [
  { key: "enrolment", title: "Enrolment", icon: "🎒", tint: "bg-pink-50" },
  { key: "operations", title: "Operations", icon: "🏠", tint: "bg-sky-50" },
  { key: "wellbeing", title: "Wellbeing", icon: "🌱", tint: "bg-green-50" },
];

function ReportsBoard({
  boardKeyFigures,
  boardEnrolment,
  boardOperations,
  boardWellbeing,
  periodLabel,
  insight,
  exportBoard,
  card,
  primary,
}) {
  const items = { enrolment: boardEnrolment, operations: boardOperations, wellbeing: boardWellbeing };
  return (
    <div className="space-y-4 w-full pb-8">
      <ReportsBanner icon="📋" title="Board Report" subtitle={periodLabel} insight={insight} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {boardKeyFigures.map((f) => (
          <div key={f.label} className={`${card} min-w-0`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${f.tint}`} aria-hidden="true">
              {f.icon}
            </span>
            <p className={`text-2xl font-bold mt-3 ${f.text}`}>{f.value}</p>
            <p className="text-xs text-gray-500 mt-1">{f.label}</p>
          </div>
        ))}
      </div>

      {SECTIONS.map((s) => (
        <div key={s.key} className={card}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${s.tint}`} aria-hidden="true">{s.icon}</span>
            {s.title}
          </h3>
          <ul className="space-y-2">
            {items[s.key].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-400 mt-0.5 shrink-0">●</span>
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button onClick={exportBoard} className={primary}>
        📄 Export as PDF
      </button>
    </div>
  );
}

export default ReportsBoard;
