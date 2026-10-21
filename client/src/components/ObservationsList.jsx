function ObservationsList({
  showForm,
  setShowForm,
  selectedCategory,
  setSelectedCategory,
  note,
  setNote,
  categories,
  getCategoryBg,
  getCategoryColour,
  handleSave,
  observations,
  card,
}) {
  return (
    <>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold mb-6 shadow-lg hover:bg-orange-500 active:scale-[0.98] transition"
        >
          + Add Observation
        </button>
      )}

      {showForm && (
        <div className={`${card} mb-6`}>
          <h2 className="font-semibold text-gray-900 mb-3">New Observation</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-md active:scale-95 transition ${
                  selectedCategory === cat ? getCategoryBg(cat) : "bg-gray-100 text-gray-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your observation here..."
            className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm mb-4 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                setNote("");
              }}
              className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium text-sm border border-gray-200 shadow-lg active:scale-[0.98] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {observations.map((obs) => (
          <div key={obs.id} className={card}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${getCategoryColour(obs.category)}`}>
                {obs.category}
              </span>
              <span className="text-xs text-gray-400">{obs.date}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{obs.note}</p>
            <p className="text-xs text-gray-400">— {obs.teacher}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default ObservationsList;