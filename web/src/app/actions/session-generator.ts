"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface SessionParams {
  ageGroup: string;
  sessionType: string;
  focusArea: string;
  durationMinutes: number;
  squadSize: number;
  sessionId?: string;
}

export async function generateSessionPlan(
  params: SessionParams
): Promise<{ plan?: string; error?: string }> {
  try {
    await requireUser();

    const { ageGroup, sessionType, focusArea, durationMinutes, squadSize } = params;

    const prompt = `You are an elite youth football development coach. Generate a complete training session plan.

Session details:
- Age Group: ${ageGroup}
- Session Type: ${sessionType}
- Focus Area: ${focusArea}
- Duration: ${durationMinutes} minutes
- Squad Size: ${squadSize} players

Generate exactly 5 drills in this format (plain text, no markdown, no asterisks):

DRILL 1: [Drill Name] ([duration] min)
Setup: [brief setup description]
Instructions: [how to run the drill]
Coaching Points: [2 key coaching cues]

DRILL 2: [Drill Name] ([duration] min)
Setup: [brief setup description]
Instructions: [how to run the drill]
Coaching Points: [2 key coaching cues]

DRILL 3: [Drill Name] ([duration] min)
Setup: [brief setup description]
Instructions: [how to run the drill]
Coaching Points: [2 key coaching cues]

DRILL 4: [Drill Name] ([duration] min)
Setup: [brief setup description]
Instructions: [how to run the drill]
Coaching Points: [2 key coaching cues]

DRILL 5: [Drill Name] ([duration] min)
Setup: [brief setup description]
Instructions: [how to run the drill]
Coaching Points: [2 key coaching cues]

Ensure progression: warm-up -> technical -> tactical/opposed -> small-sided game -> cool-down.
Keep it age-appropriate and practical.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 600,
        systemInstruction:
          "You are an elite youth football development coach. Generate structured, practical training session plans. Plain text only — no asterisks, no Markdown formatting.",
      },
    });

    let text = response.text ?? "";
    text = text.replace(/\*/g, "");

    return { plan: text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI service unavailable." };
  }
}
