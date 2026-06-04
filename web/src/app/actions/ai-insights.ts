"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function getPlayerInsights(playerId: string): Promise<{
  insights?: string;
  error?: string;
}> {
  try {
    const { supabase } = await requireUser();

    const [
      playerResult,
      ratingsResult,
      attrsResult,
      milestonesResult
    ] = await Promise.all([
      supabase
        .from("players")
        .select("full_name, position, date_of_birth")
        .eq("id", playerId)
        .single(),

      supabase
        .from("player_ratings")
        .select("rating, note, created_at, fixtures(opponent, fixture_date)")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("player_attributes")
        .select("pace, shooting, passing, dribbling, defending, physical")
        .eq("player_id", playerId),

      supabase
        .from("player_milestone_completions")
        .select(
          "template_id, completed_at, development_milestone_templates(title, category)"
        )
        .eq("player_id", playerId)
        .order("completed_at", { ascending: false })
        .limit(20),
    ]);

    const player = playerResult?.data;
    const ratings = ratingsResult?.data;
    const attrs = attrsResult?.data;
    const milestones = milestonesResult?.data;

    if (!player) return { error: "Player not found." };

    const age = player.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(player.date_of_birth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    const attrRows = attrs ?? [];

    const avg = (key: string) => {
      if (!attrRows.length) return null;
      return Math.round(
        attrRows.reduce((sum: number, r: any) => sum + (r[key] ?? 0), 0) /
          attrRows.length
      );
    };

    const attributeSummary = attrRows.length
      ? `Pace ${avg("pace")}, Shooting ${avg("shooting")}, Passing ${avg(
          "passing"
        )}, Dribbling ${avg("dribbling")}, Defending ${avg(
          "defending"
        )}, Physical ${avg("physical")}`
      : "No attribute assessments yet";

    const ratingsSummary = (ratings ?? [])
      .map((r: any) => {
        const fix = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
        return `${r.rating}/5 vs ${fix?.opponent ?? "training"}${
          r.note ? ` — "${r.note}"` : ""
        }`;
      })
      .join("; ");

    const completedMilestones = (milestones ?? [])
      .map((m: any) => {
        const t = Array.isArray(m.development_milestone_templates)
          ? m.development_milestone_templates[0]
          : m.development_milestone_templates;

        return t ? `${t.category}: ${t.title}` : null;
      })
      .filter(Boolean)
      .join(", ");

    // OPTIMIZED PROMPT: Banning Markdown to output raw, clean text
    const prompt = `Analyze the following youth football data to generate a concise, high-impact technical report for the coaching staff dashboard.

CRITICAL RULES:
- Use the third person exclusively (e.g., "${player.full_name}", "the player", "he/she"). No second-person pronouns.
- Be highly analytical and specific to the provided metrics.
- Keep the total response strictly between 150 and 200 words.
- DO NOT use any Markdown formatting (no asterisks, no bolding). Use standard dashes "-" for lists.

Player Profile:
- Name: ${player.full_name}
- Position: ${player.position ?? "Unknown"}
- Age: ${age ?? "Unknown"}

Data Context:
- Match Ratings (Last 10): ${ratingsSummary || "None recorded"}
- Attributes (Avg/100): ${attributeSummary}
- Milestones: ${completedMilestones || "None recorded"}

Output format (Use these exact plain text headers):
1. STRENGTHS: (1-2 dashed points)
2. PRIORITY DEVELOPMENT: (1-2 dashed points)
3. RECOMMENDED DRILLS: (1-2 dashed points)
4. MOTIVATIONAL NOTE: (One concluding sentence)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        systemInstruction: "You are an elite youth academy technical director providing sharp, data-driven player evaluations for coaching staff.",
      }
    });

    let text = response.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    // Failsafe: Strip out any asterisks the AI accidentally includes
    text = text.replace(/\*/g, ""); 

    return { insights: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI service unavailable.",
    };
  }
}
