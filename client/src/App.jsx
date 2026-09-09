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

// Shared nav button style
const navBtn = (active, activeColor = "text-orange-500") =>
  `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition active:scale-95 ${
    active ? activeColor : "text-gray-400 hover:text-gray-600"
  }`;

// ---------- TEACHER BOTTOM NAV ----------
function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2.5 flex justify-between items-center">
        <button onClick={() => navigate("/home")} className={navBtn(isActive("/home"))}>
          <span className="text-lg">🏠</span>
          <span className={`text-[10px] ${isActive("/home") ? "font-semibold" : ""}`}>Home</span>
        </button>
        <button onClick={() => navigate("/attendance")} className={navBtn(isActive("/attendance"), "text-green-500")}>
          <span className="text-lg">✓</span>
          <span className={`text-[10px] ${isActive("/attendance") ? "font-semibold" : ""}`}>Attendance</span>
        </button>
        <button onClick={() => navigate("/learners")} className={navBtn(isActive("/learners"))}>
          <span className="text-lg">🎒</span>
          <span className={`text-[10px] ${isActive("/learners") ? "font-semibold" : ""}`}>Learners</span>
        </button>
        <button onClick={() => navigate("/classes")} className={navBtn(isActive("/classes"))}>
          <span className="text-lg">🏫</span>
          <span className={`text-[10px] ${isActive("/classes") ? "font-semibold" : ""}`}>Classes</span>
        </button>
        <button onClick={() => navigate("/signout")} className={navBtn(isActive("/signout"))}>
          <span className="text-lg">🚪</span>
          <span className={`text-[10px] ${isActive("/signout") ? "font-semibold" : ""}`}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ---------- MANAGER BOTTOM NAV ----------
function ManagerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-2 py-2.5 flex justify-between items-center">
        <button onClick={() => navigate("/manager")} className={navBtn(isActive("/manager"))}>
          <span className="text-lg">🏠</span>
          <span className={`text-[10px] ${isActive("/manager") ? "font-semibold" : ""}`}>Home</span>
        </button>
        <button onClick={() => navigate("/manager/attendance")} className={navBtn(isActive("/manager/attendance"), "text-green-500")}>
          <span className="text-lg">✓</span>
          <span className={`text-[10px] ${isActive("/manager/attendance") ? "font-semibold" : ""}`}>Attendance</span>
        </button>
        <button onClick={() => navigate("/manager/learners")} className={navBtn(isActive("/manager/learners"))}>
          <span className="text-lg">🎒</span>
          <span className={`text-[10px] ${isActive("/manager/learners") ? "font-semibold" : ""}`}>Learners</span>
        </button>
        <button onClick={() => navigate("/manager/classes")} className={navBtn(isActive("/manager/classes"))}>
          <span className="text-lg">🏫</span>
          <span className={`text-[10px] ${isActive("/manager/classes") ? "font-semibold" : ""}`}>Classes</span>
        </button>
        <button onClick={() => navigate("/manager/signout")} className={navBtn(isActive("/manager/signout"))}>
          <span className="text-lg">🚪</span>
          <span className={`text-[10px] ${isActive("/manager/signout") ? "font-semibold" : ""}`}>Sign Out</span>
        </button>
        <button onClick={() => navigate("/reports")} className={navBtn(isActive("/reports"))}>
          <span className="text-lg">📊</span>
          <span className={`text-[10px] ${isActive("/reports") ? "font-semibold" : ""}`}>Reports</span>
        </button>
      </div>
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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/home" element={<TeacherLayout><Home /></TeacherLayout>} />
        <Route path="/attendance" element={<TeacherLayout><Attendance /></TeacherLayout>} />
        <Route path="/learners" element={<TeacherLayout><Learners /></TeacherLayout>} />
        <Route path="/classes" element={<TeacherLayout><Classes /></TeacherLayout>} />
        <Route path="/signout" element={<TeacherLayout><SignOut /></TeacherLayout>} />
        <Route path="/observations" element={<TeacherLayout><Observations /></TeacherLayout>} />

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