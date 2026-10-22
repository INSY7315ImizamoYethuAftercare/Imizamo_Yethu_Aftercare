function ReportsBoard({
  boardEnrolment,
  boardOperations,
  boardWellbeing,
  periodLabel,
  exportBoard,
  card,
  primary,
}) {
  return (
    <div className="space-y-4 w-full pb-8">
      <div className="bg-orange-50 rounded-2xl p-4 sm:p-6 text-center shadow-lg border border-orange-100">
        <div className="text-2xl sm:text-3xl mb-2">📋</div>
        <h2 className="font-bold text-orange-500 text-base sm:text-lg">Board Report</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{periodLabel}</p>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Enrolment</h3>
        <ul className="space-y-2">
          {boardEnrolment.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-orange-400 mt-0.5 shrink-0">●</span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Operations</h3>
        <ul className="space-y-2">
          {boardOperations.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-orange-400 mt-0.5 shrink-0">●</span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Wellbeing</h3>
        <ul className="space-y-2">
          {boardWellbeing.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-orange-400 mt-0.5 shrink-0">●</span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={exportBoard} className={primary}>
        📄 Export as PDF
      </button>
    </div>
  );
}

export default ReportsBoard;