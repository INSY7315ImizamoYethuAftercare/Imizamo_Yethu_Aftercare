import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ManagerHome from "./pages/ManagerHome";
import AdminHome from "./pages/AdminHome";
import ParentHome from "./pages/ParentHome";
import ParentSettings from "./pages/ParentSettings";
import Attendance from "./pages/Attendance";
import Learners from "./pages/Learners";
import Classes from "./pages/Classes";
import SignOut from "./pages/SignOut";
import Observations from "./pages/Observations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Escalations from "./pages/Escalations";

const navBtn = (active, activeColor = "text-orange-500") =>
  `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition active:scale-95 ${
    active ? activeColor : "text-gray-400 hover:text-gray-600"
  }`;

function NavShell({ children }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2.5 flex justify-between items-center">
        {children}
      </div>
    </div>
  );
}

function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <NavShell>
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
    </NavShell>
  );
}

function ManagerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-2 py-2.5 flex justify-between items-center">
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

function AdminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <NavShell>
      <button onClick={() => navigate("/admin")} className={navBtn(isActive("/admin"))}>
        <span className="text-lg">🏠</span>
        <span className={`text-[10px] ${isActive("/admin") ? "font-semibold" : ""}`}>Home</span>
      </button>
      <button onClick={() => navigate("/admin/attendance")} className={navBtn(isActive("/admin/attendance"), "text-green-500")}>
        <span className="text-lg">✓</span>
        <span className={`text-[10px] ${isActive("/admin/attendance") ? "font-semibold" : ""}`}>Attendance</span>
      </button>
      <button onClick={() => navigate("/admin/learners")} className={navBtn(isActive("/admin/learners"))}>
        <span className="text-lg">🎒</span>
        <span className={`text-[10px] ${isActive("/admin/learners") ? "font-semibold" : ""}`}>Learners</span>
      </button>
      <button onClick={() => navigate("/admin/reports")} className={navBtn(isActive("/admin/reports"))}>
        <span className="text-lg">📊</span>
        <span className={`text-[10px] ${isActive("/admin/reports") ? "font-semibold" : ""}`}>Reports</span>
      </button>
    </NavShell>
  );
}

function ParentBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith("/parent");

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2.5 flex justify-center items-center">
        <button onClick={() => navigate("/parent")} className={navBtn(isActive, "text-orange-500")}>
          <span className="text-lg">💛</span>
          <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>My Child</span>
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

function AdminLayout({ children }) {
  return (
    <div>
      {children}
      <AdminBottomNav />
    </div>
  );
}

function ParentLayout({ children }) {
  return (
    <div>
      {children}
      <ParentBottomNav />
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
        <Route path="/manager/escalations" element={<ManagerLayout><Escalations /></ManagerLayout>} />
        <Route path="/reports" element={<ManagerLayout><Reports /></ManagerLayout>} />
        <Route path="/settings" element={<ManagerLayout><Settings /></ManagerLayout>} />

        <Route path="/admin" element={<AdminLayout><AdminHome /></AdminLayout>} />
        <Route path="/admin/attendance" element={<AdminLayout><Attendance role="Admin" /></AdminLayout>} />
        <Route path="/admin/learners" element={<AdminLayout><Learners role="Admin" /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><Reports role="Admin" /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><Settings role="Admin" /></AdminLayout>} />
        <Route path="/admin/observations" element={<AdminLayout><Observations role="Admin" /></AdminLayout>} />

        <Route path="/parent" element={<ParentLayout><ParentHome /></ParentLayout>} />
        <Route path="/parent/settings" element={<ParentLayout><ParentSettings /></ParentLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;