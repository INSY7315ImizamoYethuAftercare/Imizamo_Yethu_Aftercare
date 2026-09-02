function Observations() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Imizamo Yethu Learning Hub" 
            className="w-9 h-9 object-contain"
          />
          <div>
            <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
            <p className="text-xs text-gray-500">Teacher • Yellow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <span className="text-lg">🔔</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <span className="text-lg">⋮</span>
          </button>
        </div>
      </div>

      {/* Learner Header Banner */}
      <div className="bg-yellow-300 px-4 py-4">
        <button className="text-sm text-gray-700 mb-2 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Aisha Petersen</h1>
        <p className="text-sm text-gray-700">Grade 2 • Yellow</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-4 pb-28">
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-green-500">94%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-800">7 yrs</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-orange-500">2</p>
            <p className="text-xs text-gray-500">Observations</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">
            Reading Club
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
            Art
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button className="flex-1 py-2 rounded-full text-sm font-medium bg-white text-gray-500 border border-gray-200">
            Profile
          </button>
          <button className="flex-1 py-2 rounded-full text-sm font-medium bg-yellow-300 text-gray-800">
            Observations
          </button>
          <button className="flex-1 py-2 rounded-full text-sm font-medium bg-white text-gray-500 border border-gray-200">
            Attendance
          </button>
        </div>

        {/* Add Observation Button */}
        <button className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-6 shadow-sm">
          + Add Observation
        </button>

        {/* We will add the list of observations here next */}

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">✓</span>
          <span className="text-[10px]">Attendance</span>
        </button>

        <button className="flex flex-col items-center text-red-400 gap-0.5">
          <span className="text-lg">🎒</span>
          <span className="text-[10px] font-medium">Learners</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🏫</span>
          <span className="text-[10px]">Classes</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 gap-0.5">
          <span className="text-lg">🚪</span>
          <span className="text-[10px]">Sign Out</span>
        </button>
      </div>

    </div>
  );
}

export default Observations;