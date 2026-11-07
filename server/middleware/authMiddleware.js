const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect Middleware
 * Verifies JWT token in Authorization Bearer header
 * and attaches authenticated user document to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route, no token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "student_records_manager_verstech_jwt_secret_2026",
    );

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token.",
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Restricts access to specified roles (e.g. 'admin', 'teacher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user ? req.user.role : "unknown"}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
