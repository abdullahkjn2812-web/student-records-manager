import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage({ setActiveTab }) {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/dashboard/stats");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load dashboard statistics.");
      }
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading real-time academic dashboard statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <p>⚠️ Error loading dashboard: {error}</p>
          <button className="btn btn-secondary mt-2" onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalStudents = 0,
    totalAcademicRecords = 0,
    academicSummary = {},
    recentStudents = [],
  } = stats || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong> ({user?.role?.toUpperCase()}). Live database statistics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab("students")}>
          🔍 Search & Manage Students
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">👨‍🎓</div>
          <div className="stat-content">
            <div className="stat-label">Total Enrolled Students</div>
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-meta">Active student profiles</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">📚</div>
          <div className="stat-content">
            <div className="stat-label">Academic Records</div>
            <div className="stat-value">{totalAcademicRecords}</div>
            <div className="stat-meta">Subject marks recorded</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">📈</div>
          <div className="stat-content">
            <div className="stat-label">Overall Average %</div>
            <div className="stat-value">{academicSummary.overallAveragePercentage || 0}%</div>
            <div className="stat-meta">Across all graded subjects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">🏆</div>
          <div className="stat-content">
            <div className="stat-label">Subject Passing Rate</div>
            <div className="stat-value">{academicSummary.passingRate || 0}%</div>
            <div className="stat-meta">Marks &ge; 50% threshold</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Summary</h3>
            <span className="badge badge-subtle">MongoDB Aggregation</span>
          </div>
          <div className="summary-list">
            <div className="summary-item">
              <span className="summary-label">Highest Score Achieved</span>
              <span className="summary-val text-green">{academicSummary.highestPercentage || 0}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Marks Evaluated</span>
              <span className="summary-val">
                {academicSummary.totalObtainedMarks || 0} / {academicSummary.totalPossibleMarks || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Active Roles</span>
              <span className="summary-val">Administrator, Teacher</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Authentication Model</span>
              <span className="summary-val">JWT (JSON Web Token) + Bcrypt</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recently Added Students</h3>
            <button className="link-btn" onClick={() => setActiveTab("students")}>
              View All &rarr;
            </button>
          </div>
          {recentStudents.length === 0 ? (
            <p className="empty-text">No students added yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <span className="badge badge-code">{s.rollNumber}</span>
                      </td>
                      <td className="font-semibold">{s.name}</td>
                      <td>{s.className}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
