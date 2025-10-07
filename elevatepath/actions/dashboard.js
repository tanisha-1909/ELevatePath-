"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("Gemini API failed:", err.message);

    // ✅ fallback JSON so your DB and UI don't break
    return {
      salaryRanges: [
        { role: "Software Engineer", min: 40000, max: 90000, median: 65000, location: "Global" },
        { role: "Data Analyst", min: 35000, max: 80000, median: 60000, location: "Global" },
      ],
      growthRate: 0,
      demandLevel: "MEDIUM",
      topSkills: ["Problem Solving", "Communication"],
      marketOutlook: "NEUTRAL",
      keyTrends: ["Insights unavailable due to quota limits"],
      recommendedSkills: ["Learn continuously"],
    };
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If the user is already linked to an IndustryInsight, return it fast
  if (user.industryInsight) {
    return user.industryInsight;
  }

  // Otherwise, generate (or reuse existing per-industry) and link the user to it
  const insights = await generateAIInsights(user.industry);

  const industryInsight = await db.industryInsight.upsert({
    where: { industry: user.industry }, // unique field
    update: {
      ...insights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      industry: user.industry,
      ...insights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Link the user so subsequent loads are instant and do NOT re-call AI
  await db.user.update({
    where: { id: user.id },
    data: { industryInsightId: industryInsight.id },
  });

  return industryInsight;
}