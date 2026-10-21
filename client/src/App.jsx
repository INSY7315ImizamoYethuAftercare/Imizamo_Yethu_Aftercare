import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { restoreSession, homePathFor, useSession, CHOOSE_PASSWORD_PATH } from "./services/session";

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
import Staff from "./pages/Staff";
import TeacherSettings from "./pages/TeacherSettings";
import ChoosePassword from "./pages/ChoosePassword";

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
      <button onClick={() => navigate("/admin/reports")} className={navBtn(isActive("/admin/reports"))}>
        <span className="text-lg">📊</span>
        <span className={`text-[10px] ${isActive("/admin/reports") ? "font-semibold" : ""}`}>Reports</span>
      </button>
      <button onClick={() => navigate("/admin/settings")} className={navBtn(isActive("/admin/settings"))}>
        <span className="text-lg">⚙️</span>
        <span className={`text-[10px] ${isActive("/admin/settings") ? "font-semibold" : ""}`}>Settings</span>
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

// Only lets the right kind of logged-in user through. Asks the server once
// per page load whether the session cookie is still valid.
function Protected({ role, children }) {
  const { user, status } = useSession();
  useEffect(() => {
    restoreSession();
  }, []);

  if (status === "unknown") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  // After a master admin's reset: choose your own password first.
  if (user.mustChangePassword) return <Navigate to={CHOOSE_PASSWORD_PATH} replace />;
  if (user.appRole !== role) return <Navigate to={homePathFor(user.appRole)} replace />;
  return children;
}

function TeacherLayout({ children }) {
  return (
    <Protected role="teacher">
      {children}
      <TeacherBottomNav />
    </Protected>
  );
}

function ManagerLayout({ children }) {
  return (
    <Protected role="manager">
      {children}
      <ManagerBottomNav />
    </Protected>
  );
}

function AdminLayout({ children }) {
  return (
    <Protected role="admin">
      {children}
      <AdminBottomNav />
    </Protected>
  );
}

function ParentLayout({ children }) {
  return (
    <Protected role="guardian">
      {children}
      <ParentBottomNav />
    </Protected>
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
        <Route path="/teacher/settings" element={<TeacherLayout><TeacherSettings /></TeacherLayout>} />
        <Route path={CHOOSE_PASSWORD_PATH} element={<ChoosePassword />} />

        <Route path="/manager/observations" element={<ManagerLayout><Observations role="Manager" /></ManagerLayout>} />
        <Route path="/manager" element={<ManagerLayout><ManagerHome /></ManagerLayout>} />
        <Route path="/manager/attendance" element={<ManagerLayout><Attendance role="Manager" /></ManagerLayout>} />
        <Route path="/manager/learners" element={<ManagerLayout><Learners role="Manager" /></ManagerLayout>} />
        <Route path="/manager/classes" element={<ManagerLayout><Classes role="Manager" /></ManagerLayout>} />
        <Route path="/manager/signout" element={<ManagerLayout><SignOut role="Manager" /></ManagerLayout>} />
        <Route path="/manager/escalations" element={<ManagerLayout><Escalations /></ManagerLayout>} />
        <Route path="/manager/observations" element={<ManagerLayout><Observations role="Manager" /></ManagerLayout>} />
        <Route path="/manager/staff" element={<ManagerLayout><Staff /></ManagerLayout>} />
        <Route path="/reports" element={<ManagerLayout><Reports /></ManagerLayout>} />
        <Route path="/settings" element={<ManagerLayout><Settings /></ManagerLayout>} />

        <Route path="/admin" element={<AdminLayout><AdminHome /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><Reports role="Admin" /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><Settings role="Admin" /></AdminLayout>} />
        {/* Admins see totals only, never individual learners or the register
            (POPIA): old links to those pages go back to the admin home. */}
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

        <Route path="/parent" element={<ParentLayout><ParentHome /></ParentLayout>} />
        <Route path="/parent/settings" element={<ParentLayout><ParentSettings /></ParentLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;