const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');
const mongoose = require('../server/node_modules/mongoose');
const User = require('../server/models/User');
const Student = require('../server/models/Student');
const Marks = require('../server/models/Marks');

// This suite may delete only an explicitly selected, dedicated test database.
const testUri = process.env.TEST_MONGO_URI;
if (!testUri) {
  throw new Error('Set TEST_MONGO_URI to a dedicated student_records_manager_test_* database.');
}

let databaseName;
try {
  const parsed = new URL(testUri);
  databaseName = decodeURIComponent(parsed.pathname.slice(1));
  assert.ok(['mongodb:', 'mongodb+srv:'].includes(parsed.protocol));
  assert.match(databaseName, /^student_records_manager_test_[A-Za-z0-9_-]+$/);
} catch {
  throw new Error('Refusing integration tests: TEST_MONGO_URI must select a student_records_manager_test_* database.');
}

let connectedToTestDatabase = false;
const childProcesses = new Set();
const projectRoot = path.resolve(__dirname, '..');
const serverWrapper = `
  const { startServer } = require('./server/server');
  startServer().then((server) => {
    process.send({ type: 'ready', port: server.address().port });
  }).catch(() => {
    process.send({ type: 'startup-failed' }, () => process.exit(1));
  });
`;

function launchServer(uri) {
  const child = spawn(process.execPath, ['-e', serverWrapper], {
    cwd: projectRoot,
    env: { ...process.env, MONGO_URI: uri, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });
  childProcesses.add(child);
  // Drain output without copying potentially sensitive driver messages into test logs.
  child.stdout.resume();
  child.stderr.resume();
  return child;
}

function waitForMessage(child, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Backend did not report startup status in time.')), timeoutMs);
    function finish(error, value) {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('error', onError);
      child.off('exit', onExit);
      if (error) reject(error);
      else resolve(value);
    }
    function onMessage(message) { finish(null, message); }
    function onError() { finish(new Error('Could not launch the backend process.')); }
    function onExit(code) { finish(new Error(`Backend exited before reporting startup status (code ${code}).`)); }
    child.once('message', onMessage);
    child.once('error', onError);
    child.once('exit', onExit);
  });
}

async function stopChild(child) {
  if (child.exitCode === null && child.signalCode === null) {
    const closed = once(child, 'close');
    child.kill();
    await closed;
  }
  childProcesses.delete(child);
}

before(async () => {
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  assert.equal(mongoose.connection.db.databaseName, databaseName);
  connectedToTestDatabase = true;
  await Promise.all([User.init(), Student.init(), Marks.init()]);
});

after(async () => {
  try {
    await Promise.all([...childProcesses].map(stopChild));
    if (connectedToTestDatabase) {
      assert.match(mongoose.connection.db.databaseName, /^student_records_manager_test_[A-Za-z0-9_-]+$/);
      assert.equal(mongoose.connection.db.databaseName, databaseName);
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await mongoose.disconnect();
  }
});

test('MongoDB enforces unique normalized user emails and stores timestamps', async () => {
  const user = await User.create({
    name: 'Test Teacher', email: 'Teacher@Example.test', password: 'test-hash-placeholder',
  });
  assert.ok(user.createdAt instanceof Date);
  assert.ok(user.updatedAt instanceof Date);
  await assert.rejects(User.create({
    name: 'Other Teacher', email: ' teacher@example.test ', password: 'test-hash-placeholder',
  }), { code: 11000 });
});

test('MongoDB enforces unique student roll numbers', async () => {
  await Student.create({ name: 'Test Student', rollNumber: 'UNIQUE-001', className: 'Class 9' });
  await assert.rejects(Student.create({
    name: 'Other Student', rollNumber: ' UNIQUE-001 ', className: 'Class 10',
  }), { code: 11000 });
});

test('Student to Marks reference supports multiple subjects without duplicate student-subject pairs', async () => {
  const first = await Student.create({ name: 'First Student', rollNumber: 'REL-001', className: 'Class 9' });
  const second = await Student.create({ name: 'Second Student', rollNumber: 'REL-002', className: 'Class 9' });
  const mathematics = await Marks.create({
    student: first._id, subject: 'Mathematics', obtainedMarks: 75, totalMarks: 100,
  });
  await Marks.create({ student: first._id, subject: 'English', obtainedMarks: 80, totalMarks: 100 });
  await Marks.create({ student: second._id, subject: 'Mathematics', obtainedMarks: 90, totalMarks: 100 });
  await assert.rejects(Marks.create({
    student: first._id, subject: ' MATHEMATICS ', obtainedMarks: 50, totalMarks: 100,
  }), { code: 11000 });
  assert.equal(await Marks.countDocuments({ student: first._id }), 2);
  const populated = await Marks.findById(mathematics._id).populate('student');
  assert.equal(populated.student.rollNumber, 'REL-001');
  assert.ok(populated.createdAt instanceof Date);
  assert.ok(populated.updatedAt instanceof Date);

  mathematics.totalMarks = 50;
  await assert.rejects(mathematics.save(), { name: 'ValidationError' });
  assert.equal((await Marks.findById(mathematics._id)).totalMarks, 100);
});

test('Actual backend serves health after connecting and returns 404 for an unimplemented student endpoint', async (t) => {
  const child = launchServer(testUri);
  t.after(() => stopChild(child));
  const message = await waitForMessage(child);
  assert.equal(message.type, 'ready');
  assert.ok(message.port > 0);
  const origin = `http://127.0.0.1:${message.port}`;
  const health = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(5000) });
  assert.equal(health.status, 200);
  assert.match(health.headers.get('content-type'), /application\/json/);
  const body = await health.json();
  assert.deepEqual(body, {
    status: 'ok',
    message: 'Student Records Manager API',
    database: 'connected',
  });
  const missing = await fetch(`${origin}/students`, { signal: AbortSignal.timeout(5000) });
  assert.equal(missing.status, 404);
});

test('Backend does not start when MongoDB is unreachable', async (t) => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const unavailablePort = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  const unavailableUri = `mongodb://127.0.0.1:${unavailablePort}/${databaseName}?serverSelectionTimeoutMS=1000`;
  const child = launchServer(unavailableUri);
  t.after(() => stopChild(child));
  const exited = once(child, 'exit');
  const message = await waitForMessage(child);
  assert.equal(message.type, 'startup-failed');
  const [exitCode] = await exited;
  assert.equal(exitCode, 1);
});
