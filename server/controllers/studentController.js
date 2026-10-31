const mongoose = require("mongoose");
const Student = require("../models/Student");
const Marks = require("../models/Marks");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

/**
 * @desc    Create a new student record
 * @route   POST /api/students
 */
const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, className, email, phone } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Student name is required." });
    }

    if (!rollNumber || typeof rollNumber !== "string" || !rollNumber.trim()) {
      return res.status(400).json({ success: false, message: "Roll number is required." });
    }

    if (!className || typeof className !== "string" || !className.trim()) {
      return res.status(400).json({ success: false, message: "Class name is required." });
    }

    const trimmedRoll = rollNumber.trim();

    // Validate optional email format
    if (email && (typeof email !== "string" || !EMAIL_REGEX.test(email.trim()))) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    // Validate optional phone format
    if (phone && (typeof phone !== "string" || !PHONE_REGEX.test(phone.trim()))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number (7-20 digits and valid symbols).",
      });
    }

    // Check for duplicate roll number
    const existingStudent = await Student.findOne({ rollNumber: trimmedRoll });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `A student with roll number '${trimmedRoll}' already exists.`,
      });
    }

    // Create and save student
    const student = await Student.create({
      name: name.trim(),
      rollNumber: trimmedRoll,
      className: className.trim(),
      email: email && typeof email === "string" ? email.trim() : undefined,
      phone: phone && typeof phone === "string" ? phone.trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Student record created successfully.",
      data: student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate roll number detected.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while creating student.",
    });
  }
};

/**
 * @desc    Get all student records
 * @route   GET /api/students
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while retrieving students.",
    });
  }
};

/**
 * @desc    Get single student by MongoDB ID
 * @route   GET /api/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format.",
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while retrieving student.",
    });
  }
};

/**
 * @desc    Update an existing student record
 * @route   PUT /api/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format.",
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const { name, rollNumber, className, email, phone } = req.body;

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "Student name cannot be empty." });
      }
      student.name = name.trim();
    }

    if (className !== undefined) {
      if (typeof className !== "string" || !className.trim()) {
        return res.status(400).json({ success: false, message: "Class name cannot be empty." });
      }
      student.className = className.trim();
    }

    if (rollNumber !== undefined) {
      if (typeof rollNumber !== "string" || !rollNumber.trim()) {
        return res.status(400).json({ success: false, message: "Roll number cannot be empty." });
      }
      const trimmedRoll = rollNumber.trim();
      if (trimmedRoll !== student.rollNumber) {
        const duplicate = await Student.findOne({
          rollNumber: trimmedRoll,
          _id: { $ne: student._id },
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: `A student with roll number '${trimmedRoll}' already exists.`,
          });
        }
        student.rollNumber = trimmedRoll;
      }
    }

    if (email !== undefined) {
      if (email === null || email === "") {
        student.email = undefined;
      } else {
        if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
          return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }
        student.email = email.trim();
      }
    }

    if (phone !== undefined) {
      if (phone === null || phone === "") {
        student.phone = undefined;
      } else {
        if (typeof phone !== "string" || !PHONE_REGEX.test(phone.trim())) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid phone number (7-20 digits and valid symbols).",
          });
        }
        student.phone = phone.trim();
      }
    }

    const updatedStudent = await student.save();

    return res.status(200).json({
      success: true,
      message: "Student record updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate roll number detected.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while updating student.",
    });
  }
};

/**
 * @desc    Delete a student record and associated marks
 * @route   DELETE /api/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format.",
      });
    }

    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Clean up any marks associated with this student
    await Marks.deleteMany({ student: id });

    return res.status(200).json({
      success: true,
      message: "Student record deleted successfully.",
      data: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while deleting student.",
    });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
