import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ManagerHome from "./pages/ManagerHome";
import Attendance from "./pages/Attendance";
import Learners from "./pages/Learners";
import Classes from "./pages/Classes";
import SignOut from "./pages/SignOut";
import Observations from "./pages/Observations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// ---------- TEACHER BOTTOM NAV ----------
function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-40">
      <button onClick={() => navigate("/home")} className={`flex flex-col items-center gap-0.5 ${isActive("/home") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🏠</span>
        <span className={`text-[10px] ${isActive("/home") ? "font-medium" : ""}`}>Home</span>
      </button>
      <button onClick={() => navigate("/attendance")} className={`flex flex-col items-center gap-0.5 ${isActive("/attendance") ? "text-green-500" : "text-gray-400"}`}>
        <span className="text-lg">✓</span>
        <span className={`text-[10px] ${isActive("/attendance") ? "font-medium" : ""}`}>Attendance</span>
      </button>
      <button onClick={() => navigate("/learners")} className={`flex flex-col items-center gap-0.5 ${isActive("/learners") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🎒</span>
        <span className={`text-[10px] ${isActive("/learners") ? "font-medium" : ""}`}>Learners</span>
      </button>
      <button onClick={() => navigate("/classes")} className={`flex flex-col items-center gap-0.5 ${isActive("/classes") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🏫</span>
        <span className={`text-[10px] ${isActive("/classes") ? "font-medium" : ""}`}>Classes</span>
      </button>
      <button onClick={() => navigate("/signout")} className={`flex flex-col items-center gap-0.5 ${isActive("/signout") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🚪</span>
        <span className={`text-[10px] ${isActive("/signout") ? "font-medium" : ""}`}>Sign Out</span>
      </button>
    </div>
  );
}

// ---------- MANAGER BOTTOM NAV ----------
function ManagerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-40">
      <button onClick={() => navigate("/manager")} className={`flex flex-col items-center gap-0.5 ${isActive("/manager") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🏠</span>
        <span className={`text-[10px] ${isActive("/manager") ? "font-medium" : ""}`}>Home</span>
      </button>
      <button onClick={() => navigate("/manager/attendance")} className={`flex flex-col items-center gap-0.5 ${isActive("/manager/attendance") ? "text-green-500" : "text-gray-400"}`}>
        <span className="text-lg">✓</span>
        <span className={`text-[10px] ${isActive("/manager/attendance") ? "font-medium" : ""}`}>Attendance</span>
      </button>
      <button onClick={() => navigate("/manager/learners")} className={`flex flex-col items-center gap-0.5 ${isActive("/manager/learners") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🎒</span>
        <span className={`text-[10px] ${isActive("/manager/learners") ? "font-medium" : ""}`}>Learners</span>
      </button>
      <button onClick={() => navigate("/manager/classes")} className={`flex flex-col items-center gap-0.5 ${isActive("/manager/classes") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🏫</span>
        <span className={`text-[10px] ${isActive("/manager/classes") ? "font-medium" : ""}`}>Classes</span>
      </button>
      <button onClick={() => navigate("/manager/signout")} className={`flex flex-col items-center gap-0.5 ${isActive("/manager/signout") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">🚪</span>
        <span className={`text-[10px] ${isActive("/manager/signout") ? "font-medium" : ""}`}>Sign Out</span>
      </button>
      <button onClick={() => navigate("/reports")} className={`flex flex-col items-center gap-0.5 ${isActive("/reports") ? "text-orange-500" : "text-gray-400"}`}>
        <span className="text-lg">📊</span>
        <span className={`text-[10px] ${isActive("/reports") ? "font-medium" : ""}`}>Reports</span>
      </button>
    </div>
  );
}

function TeacherLayout({ children }) {
  return (
    <div>
      {children}
      <TeacherBottomNav />
    </div>
  );
}

function ManagerLayout({ children }) {
  return (
    <div>
      {children}
      <ManagerBottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ========== TEACHER ========== */}
        <Route path="/home" element={<TeacherLayout><Home /></TeacherLayout>} />
        <Route path="/attendance" element={<TeacherLayout><Attendance /></TeacherLayout>} />
        <Route path="/learners" element={<TeacherLayout><Learners /></TeacherLayout>} />
        <Route path="/classes" element={<TeacherLayout><Classes /></TeacherLayout>} />
        <Route path="/signout" element={<TeacherLayout><SignOut /></TeacherLayout>} />
        <Route path="/observations" element={<TeacherLayout><Observations /></TeacherLayout>} />

        {/* ========== MANAGER ========== */}
        <Route path="/manager" element={<ManagerLayout><ManagerHome /></ManagerLayout>} />
        <Route path="/manager/attendance" element={<ManagerLayout><Attendance role="Manager" /></ManagerLayout>} />
        <Route path="/manager/learners" element={<ManagerLayout><Learners role="Manager" /></ManagerLayout>} />
        <Route path="/manager/classes" element={<ManagerLayout><Classes role="Manager" /></ManagerLayout>} />
        <Route path="/manager/signout" element={<ManagerLayout><SignOut role="Manager" /></ManagerLayout>} />
        <Route path="/reports" element={<ManagerLayout><Reports /></ManagerLayout>} />
        <Route path="/settings" element={<ManagerLayout><Settings /></ManagerLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;