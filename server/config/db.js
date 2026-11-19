const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Marks = require("../models/Marks");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Configure server/.env first.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    // Create the collections and their unique indexes before accepting requests.
    await Promise.all([User.init(), Student.init(), Marks.init()]);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    await mongoose.disconnect();
    console.error(`MongoDB setup error: ${error.name} - ${error.message}`);
    throw new Error(`MongoDB setup failed: ${error.message}`);
  }
};

module.exports = connectDB;
