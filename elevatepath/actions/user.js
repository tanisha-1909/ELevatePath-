"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

/**
 * Updates user profile and fetches/upserts industry insights.
 * Avoids Prisma transaction timeout by moving slow API calls outside the transaction.
 */
export async function updateUser(data) {
  // Get logged-in user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) {
    // Create or connect the user record on-the-fly if missing (handle existing email)
    const cu = await currentUser();
    if (!cu) throw new Error("User not Found");
    const email = cu.emailAddresses?.[0]?.emailAddress ?? "";

    user = await db.user.upsert({
      where: { email },
      update: {
        clerkUserId: cu.id,
        name: `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim(),
        imageUrl: cu.imageUrl ?? "",
      },
      create: {
        clerkUserId: cu.id,
        name: `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim(),
        imageUrl: cu.imageUrl ?? "",
        email,
      },
    });
  }

  let industryInsight = await db.industryInsight.findUnique({
    where: { industry: data.industry },
  });

  // Only fetch insights if missing or expired
  if (!industryInsight || industryInsight.nextUpdate < new Date()) {
    let insights;
    try {
      insights = await generateAIInsights(data.industry);
    } catch (e) {
      console.error("Gemini quota exceeded or API failed:", e.message);
      insights = {
        summary: "Insights unavailable right now. Please try later.",
        trends: [],
        recommendations: [],
        growthRate: 0,
      };
    }

    // Upsert industry insights outside the transaction
    industryInsight = await db.industryInsight.upsert({
      where: { industry: data.industry },
      update: {
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      },
      create: {
        industry: data.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Update user inside a transaction (fast, atomic)
  const updatedUser = await db.$transaction(async (tx) => {
    return await tx.user.update({
      where: { id: user.id },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
        industryInsightId: industryInsight?.id ?? undefined,
      },
    });
  });

  return { success: true, updatedUser, industryInsight };
}

/**
 * Checks if the user has completed onboarding (selected industry)
 */
export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
