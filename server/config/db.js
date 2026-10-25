const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Marks = require("../models/Marks");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Configure server/.env first.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    // Create the collections and their unique indexes before accepting requests.
    await Promise.all([User.init(), Student.init(), Marks.init()]);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch {
    await mongoose.disconnect();
    // Connection errors may contain credentials; do not print the raw URI/error.
    throw new Error("MongoDB setup failed. Check MONGO_URI, database availability and index permissions.");
  }
};

module.exports = connectDB;
