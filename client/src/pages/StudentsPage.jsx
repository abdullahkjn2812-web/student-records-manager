import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function StudentsPage() {
  const { authFetch, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    className: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/students?search=${encodeURIComponent(query)}` : "/api/students";
      const res = await authFetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch students.");
      }
      setStudents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(search);
  };

  const handleClearSearch = () => {
    setSearch("");
    fetchStudents("");
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      rollNumber: "",
      className: "",
      email: "",
      phone: "",
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      rollNumber: student.rollNumber || "",
      className: student.className || "",
      email: student.email || "",
      phone: student.phone || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const isEdit = !!editingStudent;
      const url = isEdit ? `/api/students/${editingStudent._id}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Operation failed.");
      }

      setFeedback({
        type: "success",
        message: isEdit
          ? `Student '${data.data.name}' updated successfully.`
          : `Student '${data.data.name}' created successfully with Roll No ${data.data.rollNumber}.`,
      });

      closeModal();
      fetchStudents(search);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    if (!isAdmin) {
      alert("Access Denied: Only users with the 'Admin' role are authorized to delete student records.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete '${student.name}' (${student.rollNumber})? This will also remove associated academic marks.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/students/${student._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete student.");
      }

      setFeedback({
        type: "success",
        message: `Student '${student.name}' deleted successfully.`,
      });
      fetchStudents(search);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Records Management</h1>
          <p className="page-subtitle">
            View, search, create, and manage registered student profiles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          ➕ Add New Student
        </button>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{feedback.type === "success" ? "✅" : "⚠️"} {feedback.message}</span>
          <button className="close-btn" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Search Bar Section */}
      <div className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name, roll number, or class..."
              className="search-input"
            />
            {search && (
              <button type="button" className="clear-btn" onClick={handleClearSearch} title="Clear search">
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button type="button" className="btn btn-outline" onClick={handleClearSearch}>
              Reset Filter
            </button>
          )}
        </form>
        {search && (
          <div className="search-meta">
            Showing search results matching: <strong>"{search}"</strong> ({students.length} found)
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching student records from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <p>Error: {error}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No student records found</h3>
            <p>{search ? "Try searching with a different name or roll number." : "Start by adding your first student."}</p>
            {!search && (
              <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Class / Semester</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <span className="badge badge-code">{student.rollNumber}</span>
                    </td>
                    <td className="font-semibold">{student.name}</td>
                    <td>{student.className}</td>
                    <td>{student.email || <span className="text-muted">—</span>}</td>
                    <td>{student.phone || <span className="text-muted">—</span>}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openEditModal(student)}
                          title="Edit Student"
                        >
                          ✏️ Edit
                        </button>
                        {isAdmin ? (
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(student)}
                            title="Delete Student"
                          >
                            🗑️ Delete
                          </button>
                        ) : (
                          <span
                            className="badge badge-subtle"
                            title="Only Admin role can delete student records"
                          >
                            🔒 Admin Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStudent ? `Edit Student: ${editingStudent.name}` : "Create New Student"}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-body">
              <div className="form-group">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Muhammad Ali"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Roll Number (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. BCS-101"
                  />
                </div>

                <div className="form-group">
                  <label>Class / Program *</label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="e.g. BS Computer Science"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ali@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +92 300 1234567"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editingStudent ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
