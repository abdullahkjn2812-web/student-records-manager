const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("../server/node_modules/mongoose");
const User = require("../server/models/User");
const Student = require("../server/models/Student");
const Marks = require("../server/models/Marks");

const userData = () => ({
  name: "Sample Teacher",
  email: "teacher@example.test",
  password: "test-hash-placeholder",
});

const studentData = () => ({
  name: "Sample Student",
  rollNumber: "TEST-001",
  className: "Class 9",
});

const marksData = () => ({
  student: new mongoose.Types.ObjectId(),
  subject: "Mathematics",
  obtainedMarks: 75,
  totalMarks: 100,
});

test("User normalizes email and defaults to teacher without implementing authentication", async () => {
  const user = new User({ ...userData(), email: " Teacher@Example.test " });
  await user.validate();
  assert.equal(user.email, "teacher@example.test");
  assert.equal(user.role, "teacher");
  assert.ok(user._id instanceof mongoose.Types.ObjectId);
});

for (const field of ["name", "email", "password"]) {
  test(`User rejects missing ${field}`, async () => {
    const values = userData();
    delete values[field];
    await assert.rejects(new User(values).validate(), {
      name: "ValidationError",
    });
  });
}

test("User accepts only the supported admin and teacher roles", async () => {
  for (const role of ["admin", "teacher"]) {
    await new User({ ...userData(), role }).validate();
  }
  await assert.rejects(
    new User({ ...userData(), role: "student" }).validate(),
    {
      name: "ValidationError",
    },
  );
});

test("Student accepts omitted optional contact details and trims the roll number", async () => {
  const student = new Student({ ...studentData(), rollNumber: " TEST-001 " });
  await student.validate();
  assert.equal(student.rollNumber, "TEST-001");
  assert.ok(student._id instanceof mongoose.Types.ObjectId);
});

for (const field of ["name", "rollNumber", "className"]) {
  test(`Student rejects missing ${field}`, async () => {
    const values = studentData();
    delete values[field];
    await assert.rejects(new Student(values).validate(), {
      name: "ValidationError",
    });
  });
}

test("Required trimmed text cannot contain only whitespace", async () => {
  await assert.rejects(new User({ ...userData(), name: "   " }).validate());
  await assert.rejects(
    new Student({ ...studentData(), rollNumber: "   " }).validate(),
  );
  await assert.rejects(
    new Marks({ ...marksData(), subject: "   " }).validate(),
  );
});

for (const field of ["student", "subject", "obtainedMarks", "totalMarks"]) {
  test(`Marks rejects missing ${field}`, async () => {
    const values = marksData();
    delete values[field];
    await assert.rejects(new Marks(values).validate(), {
      name: "ValidationError",
    });
  });
}

test("Marks rejects a malformed student identifier", async () => {
  await assert.rejects(
    new Marks({ ...marksData(), student: "not-an-object-id" }).validate(),
    {
      name: "ValidationError",
    },
  );
});

test("Marks accepts zero, full marks and fractional marks with a normalized subject", async () => {
  for (const obtainedMarks of [0, 100, 75.5]) {
    const marks = new Marks({
      ...marksData(),
      subject: " Mathematics ",
      obtainedMarks,
    });
    await marks.validate();
    assert.equal(marks.subject, "mathematics");
  }
});

for (const obtainedMarks of [-1, 101, Infinity, -Infinity, NaN]) {
  test(`Marks rejects obtainedMarks ${String(obtainedMarks)}`, async () => {
    await assert.rejects(
      new Marks({ ...marksData(), obtainedMarks }).validate(),
      {
        name: "ValidationError",
      },
    );
  });
}

for (const totalMarks of [0, -1, Infinity, -Infinity, NaN]) {
  test(`Marks rejects totalMarks ${String(totalMarks)}`, async () => {
    await assert.rejects(new Marks({ ...marksData(), totalMarks }).validate(), {
      name: "ValidationError",
    });
  });
}

test("Marks revalidates the range when only totalMarks is reduced", async () => {
  const marks = new Marks(marksData());
  await marks.validate();
  marks.totalMarks = 50;
  await assert.rejects(marks.validate(), { name: "ValidationError" });
});
