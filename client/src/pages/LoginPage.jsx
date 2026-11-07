import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email.trim() || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h2>Student Records Manager</h2>
          <p className="login-subtitle">Verstech Labs — Week 4 Secure Portal</p>
        </div>

        {(localError || authError) && (
          <div className="alert alert-error">
            <span>⚠️ {localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@school.test"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="demo-logins">
          <div className="demo-title">⚡ Quick Demo Credentials:</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-demo"
              onClick={() => handleQuickLogin("admin@school.test", "adminPassword123")}
            >
              👑 Fill Admin (Full Access)
            </button>
            <button
              type="button"
              className="btn btn-demo"
              onClick={() => handleQuickLogin("teacher@school.test", "teacherPassword123")}
            >
              🧑‍🏫 Fill Teacher (Read & Edit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
