"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not Found");

  try {
    const prompt = `
      Generate 2 technical interview questions for a ${user.industry} professional
      ${user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""}.

      Each question should be multiple choice with 4 options.

      Return the response in this JSON format only, no additional text:
      {
        "questions": [
          {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswer": "string",
            "explanation": "string"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function savequizresult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not Found");

  const questionResult = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResult.filter((q) => !q.isCorrect);

  let improvementTip = "";
  if (wrongAnswers.length > 0) {
    const wrongQuestionText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);
      improvementTip = tipResult.response.text().trim();
    } catch (error) {
      console.error("Error generating improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResult,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}


// --- Live Mock Interview (multi-turn chat) ---
export async function startMockInterview({ role, category }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not Found");

  // Create a new session
  const session = await db.mockInterviewSession.create({
    data: {
      userId: user.id,
      role,
      category,
      status: "active",
    },
  });

  const systemPrompt = `You are a professional interviewer conducting a ${category} interview for a ${role}.\n\nRules:\n- Ask one concise question at a time.\n- Keep a professional, encouraging tone.\n- Wait for the user's reply before asking the next.\n- Do NOT include any additional commentary.\n\nRespond in JSON only: { "question": "<your first question>" }`;

  let firstQuestion = "Let's begin. Could you briefly introduce yourself?";
  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().replace(/```(?:json)?\n?|```/g, "").trim();
    const parsed = JSON.parse(text);
    if (parsed?.question) firstQuestion = parsed.question;
  } catch (e) {
    // Fallback default first question
  }

  // Store AI message
  await db.mockInterviewMessage.create({
    data: {
      sessionId: session.id,
      sender: "AI",
      content: firstQuestion,
    },
  });

  return { sessionId: session.id, question: firstQuestion };
}

export async function sendMockInterviewMessage({ sessionId, message }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const session = await db.mockInterviewSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.user.clerkUserId !== userId) throw new Error("Session not found");
  if (session.status !== "active") throw new Error("Session ended");

  // Save USER message
  await db.mockInterviewMessage.create({
    data: {
      sessionId: session.id,
      sender: "USER",
      content: message,
    },
  });

  // Build short transcript for context (last 20 messages)
  const history = await db.mockInterviewMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const conversation = history
    .map((m) => `${m.sender === "AI" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n");

  const prompt = `You are interviewing for a ${session.category} interview for a ${session.role}.\nHere is the conversation so far:\n\n${conversation}\n\nNow:\n1) Briefly (1-2 sentences) evaluate the Candidate's latest answer (strengths + one improvement).\n2) Ask exactly one next, relevant question.\n\nRespond in JSON only as: { "feedback": "...", "question": "..." }`;

  let ai = { feedback: "", question: "" };
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```(?:json)?\n?|```/g, "").trim();
    const parsed = JSON.parse(text);
    ai = { feedback: parsed?.feedback || "", question: parsed?.question || "" };
  } catch (e) {
    ai = { feedback: "Good effort. Try to be more specific.", question: "Can you provide a concrete example that demonstrates this skill?" };
  }

  // Store AI turn (question + optional feedback)
  await db.mockInterviewMessage.create({
    data: {
      sessionId: session.id,
      sender: "AI",
      content: ai.question,
      evaluation: ai.feedback,
    },
  });

  return ai;
}

export async function endMockInterview({ sessionId }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const session = await db.mockInterviewSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.user.clerkUserId !== userId) throw new Error("Session not found");

  const history = await db.mockInterviewMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  const transcript = history
    .map((m) => `${m.sender === "AI" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n");

  const summaryPrompt = `You are an expert interviewer. Given the transcript, produce a concise performance summary.\nTranscript:\n${transcript}\n\nReturn JSON only as:\n{\n  "score": number, // 0-100\n  "strengths": ["..."],\n  "weaknesses": ["..."],\n  "suggestions": ["..."],\n  "overall": "2-3 sentence summary"
}`;

  let summaryText = "";
  let numericScore = null;
  try {
    const result = await model.generateContent(summaryPrompt);
    const text = result.response.text().replace(/```(?:json)?\n?|```/g, "").trim();
    const parsed = JSON.parse(text);
    numericScore = typeof parsed?.score === "number" ? parsed.score : null;
    summaryText = `Strengths: ${parsed?.strengths?.join(", ") || "-"}\nWeaknesses: ${parsed?.weaknesses?.join(", ") || "-"}\nSuggestions: ${parsed?.suggestions?.join(", ") || "-"}\nOverall: ${parsed?.overall || "-"}`;
  } catch (e) {
    summaryText = "Interview ended. Summary unavailable right now.";
  }

  const updated = await db.mockInterviewSession.update({
    where: { id: session.id },
    data: { status: "ended", endedAt: new Date(), summary: summaryText, score: numericScore ?? undefined },
  });

  return { summary: updated.summary, score: updated.score };
}
