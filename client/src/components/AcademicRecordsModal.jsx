import React, { useEffect, useState } from "react";

const emptyForm = { subject: "", obtainedMarks: "", totalMarks: "100" };

export default function AcademicRecordsModal({ student, authFetch, onClose }) {
  const [academicData, setAcademicData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingMark, setEditingMark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadAcademicData(); }, [student._id]);

  const loadAcademicData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/marks/student/${student._id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load academic records.");
      setAcademicData(data.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMark(null);
  };

  const submitMark = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      subject: form.subject,
      obtainedMarks: Number(form.obtainedMarks),
      totalMarks: Number(form.totalMarks),
    };
    try {
      const response = await authFetch(
        editingMark ? `/api/marks/${editingMark._id}` : "/api/marks",
        {
          method: editingMark ? "PUT" : "POST",
          body: JSON.stringify(editingMark ? payload : { ...payload, student: student._id }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save marks.");
      setMessage(editingMark ? "Marks updated successfully." : "Marks added successfully.");
      resetForm();
      await loadAcademicData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const startEdit = (mark) => {
    setEditingMark(mark);
    setForm({ subject: mark.subject, obtainedMarks: String(mark.obtainedMarks), totalMarks: String(mark.totalMarks) });
    setError("");
    setMessage("");
  };

  const removeMark = async (mark) => {
    if (!window.confirm(`Delete marks for ${mark.subject}?`)) return;
    setError("");
    try {
      const response = await authFetch(`/api/marks/${mark._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete marks.");
      setMessage("Marks deleted successfully.");
      await loadAcademicData();
    } catch (err) { setError(err.message); }
  };

  const summary = academicData?.summary || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog academic-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Academic Record: {student.name}</h3>
            <p className="modal-subtitle">{student.rollNumber} · {student.className}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {message && <div className="alert alert-success">✅ {message}</div>}
          <div className="academic-summary-grid">
            <div><span>Overall %</span><strong>{summary.percentage ?? 0}%</strong></div>
            <div><span>Grade</span><strong>{summary.grade || "N/A"}</strong></div>
            <div><span>GPA</span><strong>{summary.gpa ?? 0.0}</strong></div>
            <div><span>Status</span><strong>{summary.status || "N/A"}</strong></div>
          </div>
          {loading ? (
            <div className="loading-state"><div className="spinner"></div><p>Loading academic records...</p></div>
          ) : (
            <>
              <div className="academic-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(academicData?.marks || []).length === 0 ? (
                      <tr><td colSpan="5" className="empty-text">No marks recorded yet.</td></tr>
                    ) : academicData.marks.map((mark) => (
                      <tr key={mark._id}>
                        <td className="font-semibold">{mark.subject}</td>
                        <td>{mark.obtainedMarks} / {mark.totalMarks}</td>
                        <td>{mark.percentage}%</td>
                        <td><span className={`grade-pill grade-${mark.grade.replace("+", "plus")}`}>{mark.grade}</span></td>
                        <td>
                          <button className="btn-action btn-edit" onClick={() => startEdit(mark)}>Edit</button>{" "}
                          <button className="btn-action btn-delete" onClick={() => removeMark(mark)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form className="marks-form" onSubmit={submitMark}>
                <h4>{editingMark ? "Edit Subject Marks" : "Add Subject Marks"}</h4>
                <div className="form-row">
                  <div className="form-group"><label>Subject *</label><input required maxLength="50" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Mathematics" /></div>
                  <div className="form-group"><label>Obtained Marks *</label><input required min="0" type="number" step="0.01" value={form.obtainedMarks} onChange={(event) => setForm({ ...form, obtainedMarks: event.target.value })} /></div>
                  <div className="form-group"><label>Total Marks *</label><input required min="1" type="number" step="0.01" value={form.totalMarks} onChange={(event) => setForm({ ...form, totalMarks: event.target.value })} /></div>
                </div>
                <div className="modal-footer">
                  {editingMark && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel Edit</button>}
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editingMark ? "Update Marks" : "Add Marks"}</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
