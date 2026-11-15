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
  "mongodb://127.0.0.1:27017/student_records_manager_test_edge_cases";

let serverProcess;
let baseUrl;
let adminToken;
let teacherToken;
let existingStudentId;

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

  // Seed Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Edge Admin",
      email: "edge_admin@verstech.edu",
      password: "Password123",
      role: "admin",
    }),
  });
  const adminData = await adminRes.json();
  adminToken = adminData.token;

  // Seed Teacher
  const teacherRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Edge Teacher",
      email: "edge_teacher@verstech.edu",
      password: "Password123",
      role: "teacher",
    }),
  });
  const teacherData = await teacherRes.json();
  teacherToken = teacherData.token;

  // Seed a student
  const studentRes = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Seed Student",
      rollNumber: "SEED-001",
      className: "Grade 10-A",
      email: "seed@verstech.edu",
    }),
  });
  const studentData = await studentRes.json();
  existingStudentId = studentData.data._id;
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

test("1. Edge Case: Student creation rejects name exceeding 100 characters with 400", async () => {
  const longName = "A".repeat(101);
  const res = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: longName,
      rollNumber: "EDGE-NAME-LONG",
      className: "Grade 10",
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /cannot exceed 100 characters/i);
});

test("2. Edge Case: Student creation rejects rollNumber exceeding 30 characters with 400", async () => {
  const longRoll = "R".repeat(31);
  const res = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Valid Name",
      rollNumber: longRoll,
      className: "Grade 10",
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /cannot exceed 30 characters/i);
});

test("3. Edge Case: Student creation rejects className exceeding 50 characters with 400", async () => {
  const longClass = "C".repeat(51);
  const res = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Valid Name",
      rollNumber: "EDGE-CLASS-LONG",
      className: longClass,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /cannot exceed 50 characters/i);
});

test("4. Edge Case: Student update rejects name exceeding 100 characters with 400", async () => {
  const longName = "B".repeat(105);
  const res = await fetch(`${baseUrl}/api/students/${existingStudentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: longName,
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /cannot exceed 100 characters/i);
});

test("5. Security: Header without 'Bearer ' prefix rejects with 401 Unauthorized", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Token ${adminToken}`,
    },
  });

  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.success, false);
});

test("6. Security: Tampered JWT signature rejects with 401 Unauthorized", async () => {
  const tamperedToken = adminToken.slice(0, -6) + "xyz999";
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${tamperedToken}`,
    },
  });

  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.success, false);
});

test("7. Security: Registration with invalid role rejects with 400 Bad Request", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hacker User",
      email: "hacker@evil.com",
      password: "Password123",
      role: "superadmin_bypass",
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.success, false);
  assert.match(data.message, /role must be either/i);
});

test("8. Search Edge Case: Special regex symbols are safely escaped without throwing 500", async () => {
  const specialChars = ".*+?^${}()|[]\\";
  const res = await fetch(`${baseUrl}/api/students?search=${encodeURIComponent(specialChars)}`, {
    headers: {
      Authorization: `Bearer ${teacherToken}`,
    },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test("9. Search Edge Case: Empty or whitespace query returns all students", async () => {
  const res = await fetch(`${baseUrl}/api/students?search=%20%20%20`, {
    headers: {
      Authorization: `Bearer ${teacherToken}`,
    },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.length >= 1);
});

test("10. Marks Boundary Check: Negative marks rejected by Marks schema", async () => {
  const invalidMark = new Marks({
    student: existingStudentId,
    subject: "mathematics",
    obtainedMarks: -5,
    totalMarks: 100,
  });

  await assert.rejects(async () => {
    await invalidMark.validate();
  });
});
