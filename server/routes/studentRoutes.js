const express = require("express");
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

router.route("/").post(createStudent).get(getAllStudents);
router.route("/:id").get(getStudentById).put(updateStudent).delete(deleteStudent);

module.exports = router;
