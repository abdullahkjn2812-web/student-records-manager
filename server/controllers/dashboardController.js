const Student = require("../models/Student");
const Marks = require("../models/Marks");

/**
 * @desc    Get dashboard statistics and academic performance summary
 * @route   GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalAcademicRecords = await Marks.countDocuments();

    // Calculate academic performance summary from database
    const marksRecords = await Marks.find();

    let totalObtained = 0;
    let totalPossible = 0;
    let passingCount = 0;
    let highestPercentage = 0;

    marksRecords.forEach((record) => {
      totalObtained += record.obtainedMarks;
      totalPossible += record.totalMarks;

      const percentage = (record.obtainedMarks / record.totalMarks) * 100;
      if (percentage >= 50) {
        passingCount += 1;
      }
      if (percentage > highestPercentage) {
        highestPercentage = Math.round(percentage * 10) / 10;
      }
    });

    const overallAveragePercentage =
      totalPossible > 0
        ? Math.round((totalObtained / totalPossible) * 1000) / 10
        : 0;

    const passingRate =
      totalAcademicRecords > 0
        ? Math.round((passingCount / totalAcademicRecords) * 1000) / 10
        : 0;

    // Get 5 recent students
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name rollNumber className createdAt");

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalAcademicRecords,
        academicSummary: {
          overallAveragePercentage,
          passingRate,
          highestPercentage,
          totalObtainedMarks: totalObtained,
          totalPossibleMarks: totalPossible,
        },
        recentStudents,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while calculating dashboard statistics.",
    });
  }
};

module.exports = {
  getDashboardStats,
};
