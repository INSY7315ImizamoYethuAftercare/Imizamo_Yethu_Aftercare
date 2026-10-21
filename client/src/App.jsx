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

const sideNavBtn = (active, activeColor = "text-orange-500") =>
  `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition text-left ${
    active ? `${activeColor} bg-orange-50 font-semibold` : "text-gray-600 hover:bg-gray-50"
  }`;

function MobileNavShell({ children }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
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
    <>
      {/* Mobile bottom nav */}
      <MobileNavShell>
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
      </MobileNavShell>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex-col pt-6 px-3 z-30">
        <div className="px-3 mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <p className="text-sm font-semibold text-gray-800 mt-2">Imizamo Yethu</p>
        </div>
        <nav className="flex flex-col gap-1">
          <button onClick={() => navigate("/home")} className={sideNavBtn(isActive("/home"))}>
            <span>🏠</span> Home
          </button>
          <button onClick={() => navigate("/attendance")} className={sideNavBtn(isActive("/attendance"), "text-green-600")}>
            <span>✓</span> Attendance
          </button>
          <button onClick={() => navigate("/learners")} className={sideNavBtn(isActive("/learners"))}>
            <span>🎒</span> Learners
          </button>
          <button onClick={() => navigate("/classes")} className={sideNavBtn(isActive("/classes"))}>
            <span>🏫</span> Classes
          </button>
          <button onClick={() => navigate("/signout")} className={sideNavBtn(isActive("/signout"))}>
            <span>🚪</span> Sign Out
          </button>
        </nav>
      </aside>
    </>
  );
}

function ManagerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
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

      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex-col pt-6 px-3 z-30">
        <div className="px-3 mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <p className="text-sm font-semibold text-gray-800 mt-2">Imizamo Yethu</p>
        </div>
        <nav className="flex flex-col gap-1">
          <button onClick={() => navigate("/manager")} className={sideNavBtn(isActive("/manager"))}>
            <span>🏠</span> Home
          </button>
          <button onClick={() => navigate("/manager/attendance")} className={sideNavBtn(isActive("/manager/attendance"), "text-green-600")}>
            <span>✓</span> Attendance
          </button>
          <button onClick={() => navigate("/manager/learners")} className={sideNavBtn(isActive("/manager/learners"))}>
            <span>🎒</span> Learners
          </button>
          <button onClick={() => navigate("/manager/classes")} className={sideNavBtn(isActive("/manager/classes"))}>
            <span>🏫</span> Classes
          </button>
          <button onClick={() => navigate("/manager/signout")} className={sideNavBtn(isActive("/manager/signout"))}>
            <span>🚪</span> Sign Out
          </button>
          <button onClick={() => navigate("/reports")} className={sideNavBtn(isActive("/reports"))}>
            <span>📊</span> Reports
          </button>
        </nav>
      </aside>
    </>
  );
}

function AdminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <MobileNavShell>
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
      </MobileNavShell>

      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex-col pt-6 px-3 z-30">
        <div className="px-3 mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <p className="text-sm font-semibold text-gray-800 mt-2">Imizamo Yethu</p>
        </div>
        <nav className="flex flex-col gap-1">
          <button onClick={() => navigate("/admin")} className={sideNavBtn(isActive("/admin"))}>
            <span>🏠</span> Home
          </button>
          <button onClick={() => navigate("/admin/reports")} className={sideNavBtn(isActive("/admin/reports"))}>
            <span>📊</span> Reports
          </button>
          <button onClick={() => navigate("/admin/settings")} className={sideNavBtn(isActive("/admin/settings"))}>
            <span>⚙️</span> Settings
          </button>
        </nav>
      </aside>
    </>
  );
}

function ParentBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith("/parent");

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2.5 flex justify-center items-center">
          <button onClick={() => navigate("/parent")} className={navBtn(isActive, "text-orange-500")}>
            <span className="text-lg">💛</span>
            <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>My Child</span>
          </button>
        </div>
      </div>

      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex-col pt-6 px-3 z-30">
        <div className="px-3 mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <p className="text-sm font-semibold text-gray-800 mt-2">Imizamo Yethu</p>
        </div>
        <nav className="flex flex-col gap-1">
          <button onClick={() => navigate("/parent")} className={sideNavBtn(isActive)}>
            <span>💛</span> My Child
          </button>
        </nav>
      </aside>
    </>
  );
}

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
  if (user.mustChangePassword) return <Navigate to={CHOOSE_PASSWORD_PATH} replace />;
  if (user.appRole !== role) return <Navigate to={homePathFor(user.appRole)} replace />;
  return children;
}

function TeacherLayout({ children }) {
  return (
    <Protected role="teacher">
      <div className="md:pl-56">
        {children}
      </div>
      <TeacherBottomNav />
    </Protected>
  );
}

function ManagerLayout({ children }) {
  return (
    <Protected role="manager">
      <div className="md:pl-56">
        {children}
      </div>
      <ManagerBottomNav />
    </Protected>
  );
}

function AdminLayout({ children }) {
  return (
    <Protected role="admin">
      <div className="md:pl-56">
        {children}
      </div>
      <AdminBottomNav />
    </Protected>
  );
}

function ParentLayout({ children }) {
  return (
    <Protected role="guardian">
      <div className="md:pl-56">
        {children}
      </div>
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
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

        <Route path="/parent" element={<ParentLayout><ParentHome /></ParentLayout>} />
        <Route path="/parent/settings" element={<ParentLayout><ParentSettings /></ParentLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;