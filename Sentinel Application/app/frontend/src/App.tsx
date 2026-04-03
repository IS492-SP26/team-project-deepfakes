import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Reports from "./pages/Reports";
import { Shield, BarChart2, Search, Upload } from "lucide-react";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="sidebar">
          <div className="sidebar-logo">
            <Shield size={22} strokeWidth={1.5} />
            <span>SENTINEL</span>
          </div>
          <div className="sidebar-tagline">Deepfake Intelligence</div>

          <ul className="nav-links">
            {[
              { to: "/", label: "Dashboard", icon: BarChart2 },
              { to: "/analyze", label: "Analyze", icon: Upload },
              { to: "/reports", label: "Reports", icon: Search },
            ].map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="sidebar-footer">
            <div className="status-dot" />
            <span>System Online</span>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
