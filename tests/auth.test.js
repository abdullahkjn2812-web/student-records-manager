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
  "mongodb://127.0.0.1:27017/student_records_manager_test_auth";

let serverProcess;
let baseUrl;

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

let adminToken;
let teacherToken;
let testStudentId;

test("1. POST /api/auth/register - registers an admin and a teacher", async () => {
  // Register Admin
  const resAdmin = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Headmaster Admin",
      email: "admin@school.test",
      password: "adminPassword123",
      role: "admin",
    }),
  });
  assert.equal(resAdmin.status, 201);
  const adminData = await resAdmin.json();
  assert.equal(adminData.success, true);
  assert.equal(adminData.user.role, "admin");
  assert.ok(adminData.token);
  adminToken = adminData.token;

  // Register Teacher
  const resTeacher = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Maths Teacher",
      email: "teacher@school.test",
      password: "teacherPassword123",
      role: "teacher",
    }),
  });
  assert.equal(resTeacher.status, 201);
  const teacherData = await resTeacher.json();
  assert.equal(teacherData.success, true);
  assert.equal(teacherData.user.role, "teacher");
  assert.ok(teacherData.token);
  teacherToken = teacherData.token;
});

test("2. POST /api/auth/register - rejects duplicate email with 409", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: "admin@school.test",
      password: "somepassword",
    }),
  });
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("3. POST /api/auth/register - validates password length and role", async () => {
  // Short password
  const resShort = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "User",
      email: "new@school.test",
      password: "123",
    }),
  });
  assert.equal(resShort.status, 400);

  // Invalid role
  const resRole = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "User",
      email: "new2@school.test",
      password: "validPassword123",
      role: "student",
    }),
  });
  assert.equal(resRole.status, 400);
});

test("4. POST /api/auth/login - logs in successfully with valid credentials", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@school.test",
      password: "adminPassword123",
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.email, "admin@school.test");
});

test("5. POST /api/auth/login - rejects wrong password with 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@school.test",
      password: "wrongPassword",
    }),
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("6. GET /api/auth/me - returns user profile with valid Bearer token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.role, "admin");
});

test("7. GET /api/auth/me - rejects missing or invalid token with 401", async () => {
  // No token
  const resNoToken = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(resNoToken.status, 401);

  // Invalid token
  const resBadToken = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: "Bearer bad.token.here" },
  });
  assert.equal(resBadToken.status, 401);
});

test("8. Role Authorization - Teacher cannot delete student (403), Admin can (200)", async () => {
  // 1. Create a student using Teacher token
  const createRes = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Tariq Jamil",
      rollNumber: "TJ-101",
      className: "Class 10",
      email: "tariq@test.com",
    }),
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  testStudentId = createData.data._id;

  // 2. Teacher tries to delete -> 403 Forbidden
  const deleteForbiddenRes = await fetch(
    `${baseUrl}/api/students/${testStudentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${teacherToken}` },
    },
  );
  assert.equal(deleteForbiddenRes.status, 403);
  const forbiddenData = await deleteForbiddenRes.json();
  assert.match(forbiddenData.message, /access denied/i);

  // 3. Admin deletes -> 200 OK
  const deleteAdminRes = await fetch(
    `${baseUrl}/api/students/${testStudentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(deleteAdminRes.status, 200);
  const adminDeleteData = await deleteAdminRes.json();
  assert.equal(adminDeleteData.success, true);
});

test("9. Student Search - filters students by name or roll number", async () => {
  // Insert test students
  await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Zainab Bibi",
      rollNumber: "SEARCH-01",
      className: "Grade 8",
    }),
  });

  await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Hamza Abbasi",
      rollNumber: "SEARCH-02",
      className: "Grade 9",
    }),
  });

  // Search by name
  const resName = await fetch(`${baseUrl}/api/students?search=Zainab`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(resName.status, 200);
  const dataName = await resName.json();
  assert.equal(dataName.count, 1);
  assert.equal(dataName.data[0].name, "Zainab Bibi");

  // Search by roll number
  const resRoll = await fetch(`${baseUrl}/api/students?search=SEARCH-02`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(resRoll.status, 200);
  const dataRoll = await resRoll.json();
  assert.equal(dataRoll.count, 1);
  assert.equal(dataRoll.data[0].rollNumber, "SEARCH-02");
});

test("10. Dashboard Stats - returns accurate statistics and academic summary", async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.stats.totalStudents >= 2);
  assert.equal(typeof data.stats.totalAcademicRecords, "number");
  assert.ok(data.stats.academicSummary);
  assert.ok(Array.isArray(data.stats.recentStudents));
});
