function Attendance() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {/* Logo placeholder */}
          <div className="w-8 h-8 bg-blue-500 rounded-md"></div>
          <span className="text-sm font-medium text-orange-500">Ms Nkosi</span>
        </div>

        {/* Bell icon placeholder */}
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pt-4 pb-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Attendance <span className="text-green-500">✓</span>
        </h1>

        {/* More sections will go here */}
      </div>

    </div>
  );
}

export default Attendance;