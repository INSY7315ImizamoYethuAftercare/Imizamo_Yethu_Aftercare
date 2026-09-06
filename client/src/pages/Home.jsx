import { useState } from "react";

function Home() {
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

      {/* Main Content */}
      <div className="flex-1 px-4 pt-5 pb-28">
        
        {/* Greeting Card */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white">
          <p className="text-sm opacity-90">Wednesday, 29 July</p>
          <h1 className="text-xl font-bold mt-1">Good afternoon, Ms! 👋</h1>
          <p className="text-sm mt-1 opacity-90">5 of 6 learners present today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Present Today</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <p className="text-xs text-gray-500">Signed Out</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: "83%" }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎒</span>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
            <p className="text-xs text-gray-500">Total Learners</p>
          </div>
        </div>

{/* Quick Actions */}
<h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
<div className="grid grid-cols-2 gap-3 mb-6">
  <button
    onClick={() => window.location.href = "/attendance"}
    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2"
  >
    <span className="text-2xl text-green-500">✓</span>
    <span className="text-sm font-medium text-gray-800">Mark Attendance</span>
  </button>

  <button
    onClick={() => window.location.href = "/learners"}
    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2"
  >
    <span className="text-2xl">🎒</span>
    <span className="text-sm font-medium text-gray-800">View Learners</span>
  </button>

  <button
    onClick={() => window.location.href = "/signout"}
    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 col-span-2"
  >
    <span className="text-2xl">🚪</span>
    <span className="text-sm font-medium text-gray-800">Sign-Out</span>
  </button>
</div>    

        {/* Recent Activity */}
        <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-orange-400">🚪</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Zoe Ntombela signed out</p>
                <p className="text-xs text-gray-500">Ms Williams</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">17:45</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>📝</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Liam van der Berg — observation added</p>
                <p className="text-xs text-gray-500">Mr Dlamini</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">17:30</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-orange-400">🚪</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Aisha Petersen signed out</p>
                <p className="text-xs text-gray-500">Ms Nkosi</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">17:15</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Attendance marked — Red class</p>
                <p className="text-xs text-gray-500">Ms Williams</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">14:00</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Attendance marked — Yellow class</p>
                <p className="text-xs text-gray-500">Ms Nkosi</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">13:45</span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Home;