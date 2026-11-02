function ObservationsProfile({
  learner,
  canEdit,
  editing,
  startEdit,
  cancelEdit,
  saveDetails,
  saving,
  saveError,
  draftFirstName,
  setDraftFirstName,
  draftLastName,
  setDraftLastName,
  draftDob,
  setDraftDob,
  draftClassId,
  setDraftClassId,
  classes,
  card,
  ageFromDob,
}) {
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Learner details</h3>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
            >
              Edit details
            </button>
          )}
        </div>

        {!editing && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-right">{learner.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Class</span>
              <span className="font-medium text-right">{learner.group} ({learner.grade})</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Date of birth</span>
              <span className="font-medium">{learner.dateOfBirth ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Age</span>
              <span className="font-medium">{ageFromDob(learner.dateOfBirth)}</span>
            </div>
          </div>
        )}

        {editing && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-gray-500">First name</span>
              <input
                type="text"
                value={draftFirstName}
                onChange={(e) => setDraftFirstName(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-500">Last name</span>
              <input
                type="text"
                value={draftLastName}
                onChange={(e) => setDraftLastName(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-500">Date of birth</span>
              <input
                type="date"
                value={draftDob}
                onChange={(e) => setDraftDob(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-500">Class</span>
              <select
                value={draftClassId}
                onChange={(e) => setDraftClassId(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {!classes.some((c) => String(c.id) === String(learner.classId)) && (
                  <option value={String(learner.classId ?? "")}>{learner.group}</option>
                )}
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name} ({c.grade})</option>
                ))}
              </select>
            </label>
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
                {saveError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Parent / Guardian</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">Fatima Petersen</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">072 345 6789</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">fatima.petersen@gmail.com</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-right">14 Kloof Street, Hout Bay</span></div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-3">Authorised Pickups</h3>
        <div className="space-y-2 text-sm text-gray-800">
          <p>👤 Fatima Petersen</p>
          <p>👤 Ahmed Petersen</p>
          <p>👤 Zainab Hendricks</p>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
        <p className="text-sm text-gray-700">Loves reading. Mild peanut allergy.</p>
      </div>
    </div>
  );
}

export default ObservationsProfile;