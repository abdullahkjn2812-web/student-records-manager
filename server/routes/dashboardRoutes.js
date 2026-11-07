const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

// Protected dashboard stats endpoint for teachers & admins
router.get("/stats", protect, getDashboardStats);

module.exports = router;
