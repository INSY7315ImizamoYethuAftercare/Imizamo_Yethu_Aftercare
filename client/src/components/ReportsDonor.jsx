import ReportsBanner from "./ReportsBanner";
import LearnersByClass from "./LearnersByClass";
import { hasAttendance } from "../utils/insights";

function ReportsDonor({
  donorMetrics,
  classesThisMonth,
  monthLabel,
  periodLabel,
  insight,
  t,
  exportDonor,
  card,
  primary,
}) {
  return (
    <div className="space-y-4 w-full pb-8">
      <ReportsBanner icon="💼" title="Donor Impact Report" subtitle={periodLabel} insight={insight} />

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Key Impact Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {donorMetrics.map((m) => (
            <div key={m.label} className={`${card} min-w-0`}>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${m.tint}`} aria-hidden="true">
                {m.icon}
              </span>
              <p className={`text-2xl font-bold mt-3 ${m.text}`}>{m.value}</p>
              <p className="text-xs text-gray-500 mt-1 break-words">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <LearnersByClass classes={classesThisMonth} monthLabel={monthLabel} card={card} />

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-2">Narrative Summary</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          During this period, the Imizamo Yethu Learning Hub had {t.activeLearners} enrolled learner
          {t.activeLearners === 1 ? "" : "s"} across {t.classes} class group{t.classes === 1 ? "" : "s"}
          {hasAttendance(t) ? `, of whom ${t.learnersAttended} attended aftercare` : ""}.{" "}
          {t.avgAttendance === null
            ? "No attendance has been recorded in this period yet"
            : `The programme maintained a ${t.avgAttendance}% average attendance rate`}
          {t.observations > 0
            ? `, with ${t.observations} development observation${t.observations === 1 ? "" : "s"} recorded`
            : ""}
          .
        </p>
      </div>

      <button data-pdf-skip onClick={exportDonor} className={primary}>
        📄 Export as PDF
      </button>
    </div>
  );
}

export default ReportsDonor;
