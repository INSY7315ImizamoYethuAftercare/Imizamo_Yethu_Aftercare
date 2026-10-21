function ReportsDonor({
  donorMetrics,
  periodLabel,
  t,
  exportDonor,
  card,
  primary,
}) {
  return (
    <div className="space-y-4 w-full pb-8">
      <div className="bg-purple-50 rounded-2xl p-4 sm:p-6 text-center shadow-lg border border-purple-100">
        <div className="text-2xl sm:text-3xl mb-2">💼</div>
        <h2 className="font-bold text-orange-500 text-base sm:text-lg">Donor Impact Report</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{periodLabel}</p>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
        <div className="space-y-1">
          {donorMetrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{m.icon}</span>
                <span className="text-sm text-gray-600 break-words">{m.label}</span>
              </div>
              <span className="text-sm font-bold text-orange-500 sm:shrink-0 sm:text-right pl-7 sm:pl-0">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          During this period, the Imizamo Yethu Learning Hub provided aftercare services
          to {t.uniqueLearnersServed || t.activeLearners} registered learner
          {(t.uniqueLearnersServed || t.activeLearners) === 1 ? "" : "s"} across{" "}
          {t.classes} class group{t.classes === 1 ? "" : "s"}. The programme maintained a{" "}
          {t.avgAttendance}% average attendance rate
          {t.observations > 0
            ? `, with ${t.observations} development observation${t.observations === 1 ? "" : "s"} recorded`
            : ""}
          .
        </p>
      </div>

      <button onClick={exportDonor} className={primary}>
        📄 Export as PDF
      </button>
    </div>
  );
}

export default ReportsDonor;