const Feedback = require("../models/Feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const { feedbackType, suggestions, canContact } = req.body;
    
    // Check for required fields
    if (!suggestions) {
      return res.status(400).json({
        success: false,
        message: "Suggestions are required.",
      });
    }

    const newFeedback = await Feedback.create({
      user: req.user._id,
      company: req.company ? req.company._id : undefined,
      feedbackType: feedbackType || "General",
      suggestions,
      canContact: Boolean(canContact),
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting feedback",
    });
  }
};
