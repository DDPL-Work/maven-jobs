const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    q: { type: String, required: true, trim: true },
    options: { type: [String], required: true, validate: v => v.length === 4 },
    correct: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false },
);

const dailyQuizSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quizDate: { type: String, required: true, trim: true },
    title: { type: String, default: "Daily Skill Challenge" },
    subtitle: { type: String, default: "" },
    questions: { type: [questionSchema], required: true, validate: v => v.length > 0 },
  },
  { timestamps: true },
);

dailyQuizSchema.index({ userId: 1, quizDate: 1 }, { unique: true });

module.exports = mongoose.model("DailyQuiz", dailyQuizSchema);
