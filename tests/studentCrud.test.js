const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const mongoose = require("../server/node_modules/mongoose");
const Student = require("../server/models/Student");
const Marks = require("../server/models/Marks");

const testUri =
  process.env.TEST_MONGO_URI ||
  "mongodb://127.0.0.1:27017/student_records_manager_test_crud";

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

let createdStudentId;

test("1. POST /api/students - creates a student successfully", async () => {
  const res = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ahmed Khan",
      rollNumber: "BCS-001",
      className: "Semester 5",
      email: "ahmed.khan@example.com",
      phone: "+92 300 1234567",
    }),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.name, "Ahmed Khan");
  assert.equal(data.data.rollNumber, "BCS-001");
  assert.equal(data.data.className, "Semester 5");
  assert.equal(data.data.email, "ahmed.khan@example.com");
  assert.equal(data.data.phone, "+92 300 1234567");
  assert.ok(data.data._id);
  createdStudentId = data.data._id;
});

test("2. POST /api/students - rejects duplicate roll number with 409 Conflict", async () => {
  const res = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Another Ahmed",
      rollNumber: "BCS-001",
      className: "Semester 5",
    }),
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /already exists|duplicate/i);
});

test("3. POST /api/students - rejects missing required fields with 400 Bad Request", async () => {
  // Missing name
  const resNoName = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rollNumber: "BCS-002", className: "Semester 5" }),
  });
  assert.equal(resNoName.status, 400);

  // Missing rollNumber
  const resNoRoll = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Sara Ali", className: "Semester 5" }),
  });
  assert.equal(resNoRoll.status, 400);

  // Missing className
  const resNoClass = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Sara Ali", rollNumber: "BCS-002" }),
  });
  assert.equal(resNoClass.status, 400);
});

test("4. POST /api/students - rejects invalid email and phone formats with 400", async () => {
  const resBadEmail = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sara Ali",
      rollNumber: "BCS-002",
      className: "Semester 5",
      email: "not-an-email",
    }),
  });
  assert.equal(resBadEmail.status, 400);

  const resBadPhone = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sara Ali",
      rollNumber: "BCS-002",
      className: "Semester 5",
      phone: "abc",
    }),
  });
  assert.equal(resBadPhone.status, 400);
});

test("5. GET /api/students - retrieves all students", async () => {
  const res = await fetch(`${baseUrl}/api/students`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.count >= 1);
  assert.equal(data.data[0].rollNumber, "BCS-001");
});

test("6. GET /api/students/:id - retrieves a single student by ID", async () => {
  const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data._id, createdStudentId);
  assert.equal(data.data.name, "Ahmed Khan");
});

test("7. GET /api/students/:id - returns 400 for invalid MongoDB ID", async () => {
  const res = await fetch(`${baseUrl}/api/students/invalid-id-123`);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /invalid student id/i);
});

test("8. GET /api/students/:id - returns 404 for non-existent student ID", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const res = await fetch(`${baseUrl}/api/students/${fakeId}`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /student not found/i);
});

test("9. PUT /api/students/:id - updates an existing student", async () => {
  const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ahmed Khan Updated",
      className: "Semester 6",
      phone: "+92 300 9999999",
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.name, "Ahmed Khan Updated");
  assert.equal(data.data.className, "Semester 6");
  assert.equal(data.data.phone, "+92 300 9999999");
});

test("10. PUT /api/students/:id - prevents updating to an already existing roll number", async () => {
  // First create a second student
  await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Fatima Zahra",
      rollNumber: "BCS-002",
      className: "Semester 5",
    }),
  });

  // Now try to update first student's roll number to BCS-002
  const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rollNumber: "BCS-002",
    }),
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /already exists/i);
});

test("11. PUT /api/students/:id - returns 400 for invalid ID and 404 for non-existent ID", async () => {
  const resBadId = await fetch(`${baseUrl}/api/students/not-an-id`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Testing" }),
  });
  assert.equal(resBadId.status, 400);

  const fakeId = new mongoose.Types.ObjectId().toString();
  const res404 = await fetch(`${baseUrl}/api/students/${fakeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Testing" }),
  });
  assert.equal(res404.status, 404);
});

test("12. DELETE /api/students/:id - deletes a student successfully", async () => {
  const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`, {
    method: "DELETE",
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.match(data.message, /deleted successfully/i);

  // Verify it is gone from database
  const checkRes = await fetch(`${baseUrl}/api/students/${createdStudentId}`);
  assert.equal(checkRes.status, 404);
});

test("13. DELETE /api/students/:id - returns 400 for invalid ID and 404 for non-existent ID", async () => {
  const resBadId = await fetch(`${baseUrl}/api/students/bad-id`, {
    method: "DELETE",
  });
  assert.equal(resBadId.status, 400);

  const fakeId = new mongoose.Types.ObjectId().toString();
  const res404 = await fetch(`${baseUrl}/api/students/${fakeId}`, {
    method: "DELETE",
  });
  assert.equal(res404.status, 404);
});
