function ObservationsAttendance({ card }) {
  return (
    <div className={card}>
      <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
      <div className="space-y-3">
        {[
          { date: "2025-07-25", detail: "Signed out by Zainab Hendricks at 17:00", ok: true },
          { date: "2025-07-24", detail: "Signed out by Fatima Petersen at 17:15", ok: true },
          { date: "2025-07-23", detail: "Absent", ok: false },
          { date: "2025-07-22", detail: "Signed out by Ahmed Petersen at 17:45", ok: true },
          { date: "2025-07-21", detail: "Signed out by Fatima Petersen at 17:30", ok: true },
        ].map((row) => (
          <div key={row.date} className="flex items-center gap-3 text-sm">
            <span className={row.ok ? "text-green-600" : "text-red-500"}>{row.ok ? "✓" : "✗"}</span>
            <div>
              <p className="text-gray-800 font-medium">{row.date}</p>
              <p className="text-gray-500 text-xs">{row.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ObservationsAttendance;