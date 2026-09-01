function Attendance() {
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

        {/* Notification Bell Placeholder */}
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <span className="text-xl">🔔</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-2 pb-28">
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          Attendance
          <span className="text-green-500 text-xl">✓</span>
        </h1>

        {/* Colour Group Filters - Placeholder for now */}
        <div className="flex gap-2 mb-5">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-300 text-gray-800">
            Yellow
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500">
            Green
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500">
            Red
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500">
            Blue
          </button>
        </div>

        {/* Counter + Actions - Placeholder */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-3xl font-bold text-yellow-400">
            2 / 2
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-1.5 rounded-full bg-cyan-400 text-white text-sm font-medium">
              All In
            </button>
            <button className="text-sm text-gray-500 font-medium">
              Clear
            </button>
          </div>
        </div>

        {/* Learner List will go here next */}

      </div>
    </div>
  );
}

export default Attendance;