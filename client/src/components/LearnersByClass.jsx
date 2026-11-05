import { colourForClass } from "../pages/AddClassSheet";

// Each class's active learners and how many of them came in the chosen month,
// shown on the Donor and Board reports.
function LearnersByClass({ classes, monthLabel, card }) {
  const totalActive = classes.reduce((sum, c) => sum + c.activeLearners, 0);
  const recorded = classes.filter((c) => c.attendedLearners !== null);
  const totalAttended = recorded.reduce((sum, c) => sum + c.attendedLearners, 0);
  const cell = "py-2 text-right";

  return (
    <div className={card}>
      <h3 className="font-semibold text-gray-900">Learners by Class</h3>
      <p className="text-xs text-gray-400 mt-0.5 mb-3">{monthLabel}</p>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[280px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 font-medium">Class</th>
              <th className={`${cell} font-medium`}>Active learners</th>
              <th className={`${cell} font-medium`}>Came to aftercare</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-xs text-gray-400">No classes yet.</td>
              </tr>
            )}
            {classes.map((c) => (
              <tr key={c.name} className="border-b border-gray-50">
                <td className="py-2 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: colourForClass(c.name, c.colour) }}
                    />
                    {c.name}
                  </span>
                </td>
                <td className={cell}>{c.activeLearners}</td>
                <td className={cell}>{c.attendedLearners ?? "–"}</td>
              </tr>
            ))}
          </tbody>
          {classes.length > 0 && (
            <tfoot>
              <tr className="font-semibold text-gray-900">
                <td className="py-2">Total</td>
                <td className={cell}>{totalActive}</td>
                <td className={cell}>{recorded.length > 0 ? totalAttended : "–"}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Came to aftercare: active learners marked present at least once in {monthLabel}. A dash means no register was taken for that class.
      </p>
    </div>
  );
}

export default LearnersByClass;
