const express = require("express");
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Both Admin and Teacher can view and create students
router
  .route("/")
  .post(protect, authorize("admin", "teacher"), createStudent)
  .get(protect, getAllStudents);

// Both can view and update; only Admin can delete
router
  .route("/:id")
  .get(protect, getStudentById)
  .put(protect, authorize("admin", "teacher"), updateStudent)
  .delete(protect, authorize("admin"), deleteStudent);

module.exports = router;
