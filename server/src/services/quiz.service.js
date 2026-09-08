const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const DailyQuiz = require("../models/DailyQuiz");
const CandidateQuizResult = require("../models/CandidateQuizResult");
const OpenAIService = require("./openai/OpenAIService");

const QUIZ_XP_PER_CORRECT = 20;
const QUIZ_QUESTIONS_COUNT = 5;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class QuizService {
  _getDateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  async getOrCreateTodayQuiz(userId) {
    const today = this._getDateKey();

    let quiz = await DailyQuiz.findOne({ userId, quizDate: today });
    if (quiz) {
      return this._stripCorrectAnswers(quiz);
    }

    const user = await User.findById(userId).lean();
    if (!user) throw createHttpError(404, "User not found");

    const profile = await CandidateProfile.findOne({ userId }).lean();

    const skills = profile?.skills || [];
    const title = profile?.currentTitle || user?.name || "a professional";
    const headline = profile?.headline || "";
    const experience = profile?.totalExperience || "";
    const currentCompany = profile?.currentCompany || "";

    const questions = await this._generateQuestions(
      title,
      headline,
      experience,
      currentCompany,
      skills,
    );

    quiz = await DailyQuiz.create({
      userId,
      quizDate: today,
      title: "Daily Skill Challenge",
      subtitle: `Personalized for your profile as ${title}`,
      questions,
    });

    return this._stripCorrectAnswers(quiz);
  }

  _stripCorrectAnswers(quiz) {
    return {
      key: quiz.quizDate,
      title: quiz.title,
      subtitle: quiz.subtitle,
      durationSeconds: quiz.questions.length * 15,
      xpPerCorrect: QUIZ_XP_PER_CORRECT,
      maxXp: quiz.questions.length * QUIZ_XP_PER_CORRECT,
      questions: quiz.questions,
    };
  }

  async _generateQuestions(title, headline, experience, currentCompany, skills) {
    const skillsText = skills.length > 0 ? skills.join(", ") : "general professional skills";
    const experienceText = experience || "mid-level";
    const titleText = headline || title || "a professional";

    const systemPrompt =
      "You are a professional technical and soft-skills assessment creator. " +
      "Generate relevant, moderately challenging multiple-choice questions (4 options each, 1 correct) " +
      "based on the candidate's profile. " +
      "Return ONLY a valid JSON array. No markdown, no explanation. You MUST ensure the JSON is strictly valid. Escape any inner quotes.";

    const userPrompt =
      `Generate exactly ${QUIZ_QUESTIONS_COUNT} multiple-choice questions for this candidate:\n` +
      `Title: ${titleText}\n` +
      `Experience: ${experienceText}\n` +
      `Company: ${currentCompany || "N/A"}\n` +
      `Skills: ${skillsText}\n\n` +
      `Each question object must follow this exact structure:\n` +
      `{ "id": "unique-kebab-case-id", "topic": "TopicName", "q": "Question text?", "options": ["A", "B", "C", "D"], "correct": 0 }` +
      `\n\nWhere "correct" is the 0-based index of the correct option. ` +
      `Mix technical questions (from their skill areas) with role-relevant soft-skill or industry knowledge questions. ` +
      `CRITICAL: The output MUST be strictly valid JSON. Do NOT use unescaped double quotes inside strings. Use single quotes or escape them. ` +
      `Return ONLY the JSON array, no other text.`;

    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 2000,
    });

    const text =
      response?.output_text ||
      response?.output?.[0]?.content?.[0]?.text ||
      response?.output?.[0]?.text ||
      "";

    let raw = text;
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
    
    if (jsonMatch) {
      raw = jsonMatch[1];
    } else {
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        raw = text.substring(firstBracket, lastBracket + 1);
      } else {
        throw createHttpError(500, "Failed to parse quiz questions from AI response (no JSON brackets found)");
      }
    }
    raw = raw.replace(/,\s*([\]}])/g, '$1'); // fix trailing commas

    let questions;
    try {
      questions = JSON.parse(raw);
    } catch (parseError) {
      console.error("[QuizService] JSON Parse Error. Raw string:", raw);
      throw createHttpError(500, `Failed to parse quiz questions from AI response: ${parseError.message}`);
    }

    if (!Array.isArray(questions) || questions.length !== QUIZ_QUESTIONS_COUNT) {
      throw createHttpError(500, `AI returned ${questions?.length || 0} questions, expected ${QUIZ_QUESTIONS_COUNT}`);
    }

    for (const q of questions) {
      const opts = q.options || q.choices || q.answers || [];
      if (!q.id || !q.topic || !q.q || !Array.isArray(opts) || opts.length !== 4 || typeof q.correct !== "number") {
        throw createHttpError(500, "Invalid question format from AI");
      }
      q.options = opts;
    }

    return questions;
  }

  async getTodayStatus(userId) {
    const today = this._getDateKey();

    const existing = await CandidateQuizResult.findOne({
      candidateId: userId,
      quizKey: today,
    });

    const hasSubmitted = Boolean(existing);

    return {
      hasSubmitted,
      previousResult: hasSubmitted
        ? {
            score: existing.score,
            totalQuestions: existing.totalQuestions,
            xpEarned: existing.xpEarned,
            submittedAt: existing.createdAt,
          }
        : null,
    };
  }

  async submitQuiz(userId, answers) {
    const today = this._getDateKey();

    const existing = await CandidateQuizResult.findOne({
      candidateId: userId,
      quizKey: today,
    });

    if (existing) {
      throw createHttpError(409, "Today's quiz has already been submitted");
    }

    const quiz = await DailyQuiz.findOne({ userId, quizDate: today });
    if (!quiz) {
      throw createHttpError(404, "No quiz found for today. Please fetch the quiz first.");
    }

    const answerList = Array.isArray(answers) ? answers : [];
    const answerMap = new Map(
      answerList.map((answer) => [String(answer.questionId || ""), Number(answer.selectedIndex)]),
    );

    const evaluatedAnswers = quiz.questions.map((question) => {
      const selectedIndex = answerMap.has(question.id) ? answerMap.get(question.id) : -1;
      return {
        questionId: question.id,
        selectedIndex,
        isCorrect: selectedIndex === question.correct,
      };
    });

    const score = evaluatedAnswers.filter((a) => a.isCorrect).length;
    const xpEarned = score * QUIZ_XP_PER_CORRECT;

    const result = await CandidateQuizResult.create({
      candidateId: userId,
      quizKey: today,
      score,
      totalQuestions: quiz.questions.length,
      xpEarned,
      answers: evaluatedAnswers,
    });

    return {
      score: result.score,
      totalQuestions: result.totalQuestions,
      xpEarned: result.xpEarned,
      answers: result.answers,
      submittedAt: result.createdAt,
    };
  }

  async getRanking(userId) {
    const rows = await CandidateQuizResult.aggregate([
      {
        $group: {
          _id: "$candidateId",
          totalXp: { $sum: "$xpEarned" },
          quizzesPlayed: { $sum: 1 },
          bestScore: { $max: "$score" },
          lastPlayedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { totalXp: -1, bestScore: -1, lastPlayedAt: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $lookup: {
          from: "candidateprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    ]);

    const top10 = rows.slice(0, 10).map((row, index) => ({
      rank: index + 1,
      candidateId: String(row._id),
      name: row.candidate?.name || "Candidate",
      headline: row.profile?.headline || row.candidate?.department || "MavenJobs candidate",
      totalXp: Number(row.totalXp || 0),
      quizzesPlayed: Number(row.quizzesPlayed || 0),
      bestScore: Number(row.bestScore || 0),
      lastPlayedAt: row.lastPlayedAt,
    }));

    let userRank = null;
    let totalCandidates = 0;

    if (userId) {
      const allRows = await CandidateQuizResult.aggregate([
        {
          $group: {
            _id: "$candidateId",
            totalXp: { $sum: "$xpEarned" },
          },
        },
        { $sort: { totalXp: -1 } },
      ]);

      totalCandidates = allRows.length;

      const userIndex = allRows.findIndex((r) => String(r._id) === String(userId));
      if (userIndex !== -1) {
        const userData = rows.find((r) => String(r._id) === String(userId));
        userRank = {
          rank: userIndex + 1,
          totalXp: Number(allRows[userIndex].totalXp || 0),
          totalCandidates,
          name: userData?.candidate?.name || "You",
          headline: userData?.profile?.headline || "",
        };
      } else {
        const userResult = await CandidateQuizResult.findOne({ candidateId: userId });
        userRank = {
          rank: totalCandidates + 1,
          totalXp: 0,
          totalCandidates,
          name: "You",
          headline: "",
        };
      }
    }

    return { top10, userRank };
  }
}

module.exports = new QuizService();
