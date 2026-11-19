const mongoose = require("mongoose");
const Marks = require("../models/Marks");
const Student = require("../models/Student");

/**
 * Standardized academic grading rule (GPA and Letter Grade)
 * @param {number} percentage
 * @returns {{ grade: string, gpa: number, status: string, remark: string }}
 */
const calculateGradeAndStatus = (percentage) => {
  if (percentage >= 90) {
    return { grade: "A+", gpa: 4.0, status: "Pass", remark: "Outstanding" };
  }
  if (percentage >= 80) {
    return { grade: "A", gpa: 3.7, status: "Pass", remark: "Excellent" };
  }
  if (percentage >= 70) {
    return { grade: "B", gpa: 3.0, status: "Pass", remark: "Good" };
  }
  if (percentage >= 60) {
    return { grade: "C", gpa: 2.0, status: "Pass", remark: "Satisfactory" };
  }
  if (percentage >= 50) {
    return { grade: "D", gpa: 1.0, status: "Pass", remark: "Pass" };
  }
  return { grade: "F", gpa: 0.0, status: "Fail", remark: "Needs Improvement" };
};

/**
 * @desc    Add subject marks for a student
 * @route   POST /api/marks
 * @access  Protected (Admin / Teacher)
 */
const addMark = async (req, res) => {
  try {
    const { student, subject, obtainedMarks, totalMarks } = req.body;

    // Validate student ID format
    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "A valid student ID is required.",
      });
    }

    // Verify student exists in database
    const existingStudent = await Student.findById(student);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Validate subject
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required.",
      });
    }

    if (subject.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Subject name cannot exceed 50 characters.",
      });
    }

    // Validate numeric values
    if (obtainedMarks === undefined || obtainedMarks === null || typeof obtainedMarks !== "number" || !Number.isFinite(obtainedMarks)) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks must be a valid finite number.",
      });
    }

    if (totalMarks === undefined || totalMarks === null || typeof totalMarks !== "number" || !Number.isFinite(totalMarks)) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be a valid finite number.",
      });
    }

    if (obtainedMarks < 0) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks cannot be negative.",
      });
    }

    if (totalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be greater than zero.",
      });
    }

    if (obtainedMarks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks cannot exceed total marks.",
      });
    }

    const normalizedSubject = subject.trim().toLowerCase();

    // Check for duplicate subject for this student
    const duplicate = await Marks.findOne({
      student,
      subject: normalizedSubject,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Marks for subject '${normalizedSubject}' have already been recorded for this student.`,
      });
    }

    // Create and persist marks document
    const markRecord = await Marks.create({
      student,
      subject: normalizedSubject,
      obtainedMarks,
      totalMarks,
    });

    return res.status(201).json({
      success: true,
      message: `Marks for '${normalizedSubject}' recorded successfully.`,
      data: markRecord,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Marks for this subject have already been recorded for this student.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while adding marks.",
    });
  }
};

/**
 * @desc    Get all subject marks and calculated academic summary for a specific student
 * @route   GET /api/marks/student/:studentId
 * @access  Protected (Admin / Teacher)
 */
const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    const marks = await Marks.find({ student: studentId }).sort({ subject: 1 });

    let totalObtained = 0;
    let totalPossible = 0;

    const subjectsSummary = marks.map((m) => {
      totalObtained += m.obtainedMarks;
      totalPossible += m.totalMarks;

      const subjectPercentage =
        m.totalMarks > 0
          ? Math.round((m.obtainedMarks / m.totalMarks) * 1000) / 10
          : 0;

      const subjectGrade = calculateGradeAndStatus(subjectPercentage);

      return {
        _id: m._id,
        subject: m.subject,
        obtainedMarks: m.obtainedMarks,
        totalMarks: m.totalMarks,
        percentage: subjectPercentage,
        grade: subjectGrade.grade,
        status: subjectGrade.status,
      };
    });

    const overallPercentage =
      totalPossible > 0
        ? Math.round((totalObtained / totalPossible) * 1000) / 10
        : 0;

    const overallGradeInfo = calculateGradeAndStatus(overallPercentage);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          className: student.className,
        },
        marks: subjectsSummary,
        summary: {
          totalSubjects: marks.length,
          totalObtainedMarks: totalObtained,
          totalPossibleMarks: totalPossible,
          percentage: overallPercentage,
          grade: marks.length > 0 ? overallGradeInfo.grade : "N/A",
          gpa: marks.length > 0 ? overallGradeInfo.gpa : 0.0,
          status: marks.length > 0 ? overallGradeInfo.status : "N/A",
          remark: marks.length > 0 ? overallGradeInfo.remark : "No marks recorded",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while retrieving student marks.",
    });
  }
};

/**
 * @desc    Get complete student academic report card
 * @route   GET /api/marks/student/:studentId/report-card
 * @access  Protected (Admin / Teacher)
 */
const getStudentReportCard = async (req, res) => {
  return getMarksByStudent(req, res);
};

/**
 * @desc    Update a subject mark record
 * @route   PUT /api/marks/:id
 * @access  Protected (Admin / Teacher)
 */
const updateMark = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid marks record ID format.",
      });
    }

    const mark = await Marks.findById(id);
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: "Marks record not found.",
      });
    }

    const { subject, obtainedMarks, totalMarks } = req.body;

    if (subject !== undefined) {
      if (typeof subject !== "string" || !subject.trim()) {
        return res.status(400).json({ success: false, message: "Subject name cannot be empty." });
      }
      if (subject.trim().length > 50) {
        return res.status(400).json({ success: false, message: "Subject name cannot exceed 50 characters." });
      }

      const normalizedSubject = subject.trim().toLowerCase();
      if (normalizedSubject !== mark.subject) {
        const duplicate = await Marks.findOne({
          student: mark.student,
          subject: normalizedSubject,
          _id: { $ne: mark._id },
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: `Marks for '${normalizedSubject}' already exist for this student.`,
          });
        }
        mark.subject = normalizedSubject;
      }
    }

    if (totalMarks !== undefined) {
      if (typeof totalMarks !== "number" || !Number.isFinite(totalMarks) || totalMarks <= 0) {
        return res.status(400).json({ success: false, message: "Total marks must be a finite number greater than zero." });
      }
      mark.totalMarks = totalMarks;
    }

    if (obtainedMarks !== undefined) {
      if (typeof obtainedMarks !== "number" || !Number.isFinite(obtainedMarks) || obtainedMarks < 0) {
        return res.status(400).json({ success: false, message: "Obtained marks must be a finite non-negative number." });
      }
      mark.obtainedMarks = obtainedMarks;
    }

    // Validate bounds
    if (mark.obtainedMarks > mark.totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks cannot exceed total marks.",
      });
    }

    const updated = await mark.save();

    return res.status(200).json({
      success: true,
      message: "Marks record updated successfully.",
      data: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Marks for this subject already exist for this student.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while updating marks.",
    });
  }
};

/**
 * @desc    Delete a subject mark record
 * @route   DELETE /api/marks/:id
 * @access  Protected (Admin / Teacher)
 */
const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid marks record ID format.",
      });
    }

    const mark = await Marks.findByIdAndDelete(id);
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: "Marks record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Marks for '${mark.subject}' deleted successfully.`,
      data: {
        id: mark._id,
        subject: mark.subject,
        student: mark.student,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while deleting marks record.",
    });
  }
};

module.exports = {
  calculateGradeAndStatus,
  addMark,
  getMarksByStudent,
  getStudentReportCard,
  updateMark,
  deleteMark,
};
