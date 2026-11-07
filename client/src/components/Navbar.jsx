import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-title">Student Records Manager</div>
            <div className="brand-subtitle">Verstech Labs 2026</div>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            👨‍🎓 Students
          </button>
        </nav>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`role-badge ${isAdmin ? "badge-admin" : "badge-teacher"}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">
            🚪 Logout
          </button>
        </div>
      </div>
    </header>
  );
}
