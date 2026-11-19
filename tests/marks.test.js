const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const mongoose = require("../server/node_modules/mongoose");
const User = require("../server/models/User");
const Student = require("../server/models/Student");
const Marks = require("../server/models/Marks");

const testUri =
  process.env.TEST_MONGO_URI ||
  "mongodb://127.0.0.1:27017/student_records_manager_test_marks";

let serverProcess;
let baseUrl;
let teacherToken;
let adminToken;
let testStudentId;

function launchServer(uri) {
  const projectRoot = path.resolve(__dirname, "..");
  const serverWrapper = `
    const { startServer } = require('./server/server');
    startServer().then((server) => {
      process.send({ type: 'ready', port: server.address().port });
    }).catch((err) => {
      console.error(err);
      process.send({ type: 'startup-failed' }, () => process.exit(1));
    });
  `;

  const child = spawn(process.execPath, ["-e", serverWrapper], {
    cwd: projectRoot,
    env: { ...process.env, MONGO_URI: uri, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true,
  });

  child.stdout.resume();
  child.stderr.resume();
  return child;
}

function waitForMessage(child, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new Error("Backend did not report startup status in time.")),
      timeoutMs,
    );
    function finish(error, value) {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("error", onError);
      child.off("exit", onExit);
      if (error) reject(error);
      else resolve(value);
    }
    function onMessage(message) {
      finish(null, message);
    }
    function onError() {
      finish(new Error("Could not launch backend process."));
    }
    function onExit(code) {
      finish(new Error(`Backend exited early with code ${code}.`));
    }
    child.once("message", onMessage);
    child.once("error", onError);
    child.once("exit", onExit);
  });
}

before(async () => {
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  await User.deleteMany({});
  await Student.deleteMany({});
  await Marks.deleteMany({});

  serverProcess = launchServer(testUri);
  const message = await waitForMessage(serverProcess);
  assert.equal(message.type, "ready");
  baseUrl = `http://127.0.0.1:${message.port}`;

  // Register Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Marks Admin",
      email: "marks_admin@verstech.edu",
      password: "Password123",
      role: "admin",
    }),
  });
  const adminData = await adminRes.json();
  adminToken = adminData.token;

  // Register Teacher
  const teacherRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Marks Teacher",
      email: "marks_teacher@verstech.edu",
      password: "Password123",
      role: "teacher",
    }),
  });
  const teacherData = await teacherRes.json();
  teacherToken = teacherData.token;

  // Create a student for marks testing
  const studentRes = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Zainab Fatima",
      rollNumber: "BCS-2026-01",
      className: "BS Computer Science",
      email: "zainab@verstech.edu",
    }),
  });
  const studentData = await studentRes.json();
  testStudentId = studentData.data._id;
});

after(async () => {
  try {
    if (serverProcess && serverProcess.exitCode === null) {
      const closed = once(serverProcess, "close");
      serverProcess.kill();
      await closed;
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await mongoose.disconnect();
  }
});

let createdMarkId;

test("1. POST /api/marks - creates a subject mark successfully", async () => {
  const res = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Computer Programming",
      obtainedMarks: 85,
      totalMarks: 100,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.subject, "computer programming");
  assert.equal(data.data.obtainedMarks, 85);
  assert.equal(data.data.totalMarks, 100);
  createdMarkId = data.data._id;
});

test("2. POST /api/marks - rejects duplicate subject for the same student with 409 Conflict", async () => {
  const res = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "computer programming",
      obtainedMarks: 90,
      totalMarks: 100,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 409);
  assert.equal(data.success, false);
  assert.match(data.message, /already been recorded/i);
});

test("3. POST /api/marks - rejects obtainedMarks > totalMarks with 400 Bad Request", async () => {
  const res = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Calculus",
      obtainedMarks: 105,
      totalMarks: 100,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /cannot exceed total marks/i);
});

test("4. POST /api/marks - rejects negative marks and non-positive totalMarks with 400", async () => {
  // Negative obtained
  const res1 = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Physics",
      obtainedMarks: -10,
      totalMarks: 100,
    }),
  });
  const data1 = await res1.json();
  assert.equal(res1.status, 400);
  assert.equal(data1.success, false);

  // Zero total marks
  const res2 = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Physics",
      obtainedMarks: 0,
      totalMarks: 0,
    }),
  });
  const data2 = await res2.json();
  assert.equal(res2.status, 400);
  assert.equal(data2.success, false);
});

test("5. POST /api/marks - rejects non-existent student ID with 404", async () => {
  const res = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: "507f1f77bcf86cd799439011",
      subject: "Data Structures",
      obtainedMarks: 75,
      totalMarks: 100,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 404);
  assert.equal(data.success, false);
  assert.match(data.message, /student record not found/i);
});

test("6. POST /api/marks - adds additional subjects for grade calculation", async () => {
  // Subject 2: Database Systems 92/100
  const res2 = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Database Systems",
      obtainedMarks: 92,
      totalMarks: 100,
    }),
  });
  assert.equal(res2.status, 201);

  // Subject 3: Software Engineering 88/100
  const res3 = await fetch(`${baseUrl}/api/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student: testStudentId,
      subject: "Software Engineering",
      obtainedMarks: 88,
      totalMarks: 100,
    }),
  });
  assert.equal(res3.status, 201);
});

test("7. GET /api/marks/student/:studentId - retrieves marks with calculated percentage, GPA, and grade", async () => {
  const res = await fetch(`${baseUrl}/api/marks/student/${testStudentId}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.student.rollNumber, "BCS-2026-01");
  assert.equal(data.data.marks.length, 3);

  // Total: 85 + 92 + 88 = 265 / 300 = 88.3%
  assert.equal(data.data.summary.totalObtainedMarks, 265);
  assert.equal(data.data.summary.totalPossibleMarks, 300);
  assert.equal(data.data.summary.percentage, 88.3);
  assert.equal(data.data.summary.grade, "A");
  assert.equal(data.data.summary.gpa, 3.7);
  assert.equal(data.data.summary.status, "Pass");
});

test("8. GET /api/marks/student/:studentId/report-card - returns official report card", async () => {
  const res = await fetch(`${baseUrl}/api/marks/student/${testStudentId}/report-card`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.summary.grade);
  assert.ok(data.data.summary.status);
});

test("9. PUT /api/marks/:id - updates marks and recalculates grade", async () => {
  // Update Computer Programming to 96/100 (Total becomes 96 + 92 + 88 = 276 / 300 = 92% -> Grade A+)
  const res = await fetch(`${baseUrl}/api/marks/${createdMarkId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      obtainedMarks: 96,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.obtainedMarks, 96);

  // Verify updated student report card reflects Grade A+
  const resReport = await fetch(`${baseUrl}/api/marks/student/${testStudentId}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const dataReport = await resReport.json();
  assert.equal(dataReport.data.summary.percentage, 92);
  assert.equal(dataReport.data.summary.grade, "A+");
  assert.equal(dataReport.data.summary.gpa, 4.0);
});

test("10. DELETE /api/marks/:id - deletes a subject mark", async () => {
  const res = await fetch(`${baseUrl}/api/marks/${createdMarkId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${teacherToken}` },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);

  // Verify marks count reduced to 2
  const resCheck = await fetch(`${baseUrl}/api/marks/student/${testStudentId}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const dataCheck = await resCheck.json();
  assert.equal(dataCheck.data.marks.length, 2);
});

test("11. Cascading Delete: Deleting a student removes all associated marks", async () => {
  // Admin deletes student
  const delRes = await fetch(`${baseUrl}/api/students/${testStudentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(delRes.status, 200);

  // Query database directly to confirm marks are completely removed
  const orphanMarks = await Marks.find({ student: testStudentId });
  assert.equal(orphanMarks.length, 0);
});
