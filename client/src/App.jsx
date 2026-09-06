import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Attendance from "./pages/Attendance";
import Learners from "./pages/Learners";
import Classes from "./pages/Classes";
import SignOut from "./pages/SignOut";
import Observations from "./pages/Observations";

// Bottom Navigation component
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-40">
      <button
        onClick={() => navigate("/home")}
        className={`flex flex-col items-center gap-0.5 ${isActive("/home") ? "text-orange-500" : "text-gray-400"}`}
      >
        <span className="text-lg">🏠</span>
        <span className={`text-[10px] ${isActive("/home") ? "font-medium" : ""}`}>Home</span>
      </button>

      <button
        onClick={() => navigate("/attendance")}
        className={`flex flex-col items-center gap-0.5 ${isActive("/attendance") ? "text-green-500" : "text-gray-400"}`}
      >
        <span className="text-lg">✓</span>
        <span className={`text-[10px] ${isActive("/attendance") ? "font-medium" : ""}`}>Attendance</span>
      </button>

      <button
        onClick={() => navigate("/learners")}
        className={`flex flex-col items-center gap-0.5 ${isActive("/learners") ? "text-orange-500" : "text-gray-400"}`}
      >
        <span className="text-lg">🎒</span>
        <span className={`text-[10px] ${isActive("/learners") ? "font-medium" : ""}`}>Learners</span>
      </button>

      <button
        onClick={() => navigate("/classes")}
        className={`flex flex-col items-center gap-0.5 ${isActive("/classes") ? "text-orange-500" : "text-gray-400"}`}
      >
        <span className="text-lg">🏫</span>
        <span className={`text-[10px] ${isActive("/classes") ? "font-medium" : ""}`}>Classes</span>
      </button>

      <button
        onClick={() => navigate("/signout")}
        className={`flex flex-col items-center gap-0.5 ${isActive("/signout") ? "text-orange-500" : "text-gray-400"}`}
      >
        <span className="text-lg">🚪</span>
        <span className={`text-[10px] ${isActive("/signout") ? "font-medium" : ""}`}>Sign Out</span>
      </button>
    </div>
  );
}

// Wrapper for pages that need the bottom nav
function TeacherLayout({ children }) {
  return (
    <div>
      {children}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth screens (no bottom nav) */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Teacher screens (with bottom nav) */}
        <Route path="/home" element={<TeacherLayout><Home /></TeacherLayout>} />
        <Route path="/attendance" element={<TeacherLayout><Attendance /></TeacherLayout>} />
        <Route path="/learners" element={<TeacherLayout><Learners /></TeacherLayout>} />
        <Route path="/classes" element={<TeacherLayout><Classes /></TeacherLayout>} />
        <Route path="/signout" element={<TeacherLayout><SignOut /></TeacherLayout>} />
        <Route path="/observations" element={<TeacherLayout><Observations /></TeacherLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;