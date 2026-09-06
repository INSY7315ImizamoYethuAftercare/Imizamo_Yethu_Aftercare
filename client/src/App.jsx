import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <Register onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return <Login onSwitchToRegister={() => setShowRegister(true)} />;
}

export default App;