let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (e) {
  // Allow server to boot even if openai dependency isn't installed yet.
  OpenAI = null;
}

let client = null;

const getOpenAIClient = () => {
  if (client) return client;

  if (!OpenAI) {
    throw new Error(
      "OpenAI SDK is not available (missing `openai` dependency).",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI is not configured yet (OPENAI_API_KEY missing).");
  }

  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 60000);

  client = new OpenAI({
    apiKey,
    timeout: timeoutMs,
  });

  return client;
};

class OpenAIService {
  async createChatCompletion({
    model,
    systemPrompt,
    userPrompt,
    conversationHistory = [],
    maxOutputTokens = 4000,
    responseFormat,
  }) {
    const openai = getOpenAIClient();
    const maxHistoryChars = Math.min(maxOutputTokens * 4, 10000);

    const input = [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
    ];

    for (const msg of conversationHistory) {
      if (!msg || !msg.text) continue;
      const isAssistant = msg.role === "assistant";
      input.push({
        role: isAssistant ? "assistant" : "user",
        content: [
          {
            type: isAssistant ? "output_text" : "input_text",
            text: String(msg.text).slice(0, maxHistoryChars),
          },
        ],
      });
    }

    input.push({
      role: "user",
      content: [{ type: "input_text", text: userPrompt }],
    });

    const requestOptions = {
      model,
      input,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: "low" },
    };
    if (responseFormat) {
      requestOptions.response_format = responseFormat;
    }

    return openai.responses.create(requestOptions);
  }

  async createFallbackChat({
    systemPrompt,
    userPrompt,
    maxOutputTokens = 600,
  }) {
    return this.createChatCompletion({
      model:
        process.env.OPENAI_CHAT_MODEL ||
        process.env.OPENAI_MODEL ||
        "gpt-5-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens,
    });
  }

  async getSafeChatbotFallbackResponse() {
    return {
      outputText:
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If the issue persists, contact support.",
      raw: null,
      usage: { total_tokens: 0 },
      model: process.env.OPENAI_MODEL || "gpt-unknown",
      success: false,
    };
  }

  async extractPdfTextViaOpenAI(pdfBuffer, fileName) {
    const openai = getOpenAIClient();
    try {
      const uploadedFile = await openai.files.create({
        purpose: "assistants",
        file: pdfBuffer,
        filename: fileName || "document.pdf",
      });

      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                file_id: uploadedFile.id,
              },
              {
                type: "input_text",
                text: "Extract ALL text content from this PDF file. Return only the extracted text, nothing else. If you cannot read any text, return exactly: NO_TEXT_FOUND",
              },
            ],
          },
        ],
        max_output_tokens: 4096,
        reasoning: { effort: "low" },
      });

      // Clean up the uploaded file
      try {
        await openai.files.del(uploadedFile.id);
      } catch {}

      const text =
        response?.output_text ||
        response?.output?.[0]?.content?.[0]?.text ||
        "";
      const trimmed = String(text || "").trim();

      if (trimmed === "NO_TEXT_FOUND") return "";
      return trimmed;
    } catch (err) {
      console.error(
        "[OpenAIService] OpenAI PDF extraction error:",
        err.message,
      );
      return "";
    }
  }
}

module.exports = new OpenAIService();
