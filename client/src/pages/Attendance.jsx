function Attendance() {
  // Temporary fake data
  const learners = [
    { id: 1, name: "Aisha Petersen", status: "Present" },
    { id: 2, name: "Amara Okoye", status: "Present" },
    { id: 3, name: "Liam van der Berg", status: "Present" },
    { id: 4, name: "Keanu Abrahams", status: "Present" },
    { id: 5, name: "Zoe Ntombela", status: "Present" },
    { id: 6, name: "Sipho Mkhize", status: "Absent" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Imizamo Yethu Learning Hub" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-medium text-orange-500">
            Ms Nkosi
          </span>
        </div>

        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <span className="text-xl">🔔</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-2 pb-32">
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          Attendance
          <span className="text-green-500 text-xl">✓</span>
        </h1>

        {/* Colour Group Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-300 text-gray-800 whitespace-nowrap">
            Yellow
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 whitespace-nowrap">
            Green
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 whitespace-nowrap">
            Red
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 whitespace-nowrap">
            Blue
          </button>
        </div>

        {/* Counter + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-3xl font-bold text-yellow-400">
            2 / 2
          </div>
          <div className="flex gap-3 items-center">
            <button className="px-4 py-1.5 rounded-full bg-cyan-400 text-white text-sm font-medium">
              All In
            </button>
            <button className="text-sm text-gray-500 font-medium">
              Clear
            </button>
          </div>
        </div>

        {/* Learner List */}
        <div className="space-y-4 mb-8">
          {learners.map((learner) => (
            <div 
              key={learner.id}
              className="flex items-center justify-between"
            >
              <span className="text-base text-gray-800">
                {learner.name}
              </span>

              <button
                className={`px-5 py-1.5 rounded-full text-sm font-medium ${
                  learner.status === "Present"
                    ? "bg-cyan-400 text-white"
                    : "bg-orange-400 text-white"
                }`}
              >
                {learner.status}
              </button>
            </div>
          ))}
        </div>

        {/* Session Notes */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 tracking-wide mb-2">
            SESSION NOTES
          </label>
          <textarea
            placeholder="Add any notes about today's session..."
            className="w-full h-24 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
          ></textarea>
        </div>

        {/* Save Button */}
        <button className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base shadow-sm active:scale-95 transition">
          Save Attendance
        </button>

      </div>
    </div>
  );
}

export default Attendance;