import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import "./index.css";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Protected Route Logic: Unauthenticated users are shown the Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === "dashboard" && <DashboardPage setActiveTab={setActiveTab} />}
        {activeTab === "students" && <StudentsPage />}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <span>Student Records Manager — Verstech Labs 2026 Internship</span>
          <span>Intern: Abdullah Aslam</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
