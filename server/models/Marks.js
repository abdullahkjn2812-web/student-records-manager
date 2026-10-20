const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: String, required: true, trim: true, lowercase: true },
    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isFinite, message: "Obtained marks must be finite." },
    },
    totalMarks: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => Number.isFinite(value) && value > 0,
        message: "Total marks must be a finite number greater than zero.",
      },
    },
  },
  { timestamps: true },
);

// Document validation checks both fields, including changes to totalMarks.
// Future CRUD should load, assign and save rather than use query updates.
marksSchema.pre("validate", function () {
  if (this.obtainedMarks > this.totalMarks) {
    this.invalidate("obtainedMarks", "Obtained marks cannot exceed total marks.");
  }
});

marksSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("Marks", marksSchema);
