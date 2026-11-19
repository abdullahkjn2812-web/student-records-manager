const express = require("express");
const router = express.Router();
const {
  addMark,
  getMarksByStudent,
  getStudentReportCard,
  updateMark,
  deleteMark,
} = require("../controllers/marksController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Protected Marks Routes - Admin and Teacher have access to academic marks
router
  .route("/")
  .post(protect, authorize("admin", "teacher"), addMark);

router
  .route("/student/:studentId")
  .get(protect, getMarksByStudent);

router
  .route("/student/:studentId/report-card")
  .get(protect, getStudentReportCard);

router
  .route("/:id")
  .put(protect, authorize("admin", "teacher"), updateMark)
  .delete(protect, authorize("admin", "teacher"), deleteMark);

module.exports = router;
