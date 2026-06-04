"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireUser } from "@/lib/auth";

// Ensure API key exists (fail fast instead of silent runtime crash)
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

// Initialize Gemini client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getPlayerInsights(playerId: string): Promise<{
  insights?: string;
  error?: string;
}> {
  try {
    const { supabase } = await requireUser();

    const [
      { data: player },
      { data: ratings },
      { data: attrs },
      { data: milestones },
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

    if (!player) {
      return { error: "Player not found." };
    }

    // Age calculation (more accurate conversion)
    const age = player.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(player.date_of_birth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    // Safe attribute averaging
    const rows = attrs ?? [];

    const avg = (key: keyof (typeof rows)[number]) => {
      if (!rows.length) return null;
      const sum = rows.reduce((acc: number, r: any) => acc + (r[key] ?? 0), 0);
      return Math.round(sum / rows.length);
    };

    const attributeSummary = rows.length
      ? `Pace ${avg("pace")}, Shooting ${avg("shooting")}, Passing ${avg(
          "passing"
        )}, Dribbling ${avg("dribbling")}, Defending ${avg(
          "defending"
        )}, Physical ${avg("physical")}`
      : "No attribute assessments yet";

    // Ratings summary
    const ratingsSummary = (ratings ?? [])
      .map((r: any) => {
        const fix = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
        return `${r.rating}/5 vs ${fix?.opponent ?? "training"}${
          r.note ? ` — "${r.note}"` : ""
        }`;
      })
      .join("; ");

    // Milestones summary
    const completedMilestones = (milestones ?? [])
      .map((m: any) => {
        const t = Array.isArray(m.development_milestone_templates)
          ? m.development_milestone_templates[0]
          : m.development_milestone_templates;

        return t ? `${t.category}: ${t.title}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const prompt = `
You are an expert youth football development coach.

Analyse the player and provide actionable insights.

PLAYER:
Name: ${player.full_name}
Position: ${player.position ?? "Unknown"}
Age: ${age ?? "Unknown"}

RECENT RATINGS:
${ratingsSummary || "No ratings yet"}

ATTRIBUTES:
${attributeSummary}

MILESTONES:
${completedMilestones || "None recorded yet"}

OUTPUT FORMAT:

1. Strengths (2-3 points)
2. Priority development areas (2-3 points)
3. Recommended drills (2-3 drills)
4. Motivational note (1 sentence)

Rules:
- Be specific to position and age
- Only use provided data
- Keep under 300 words
- Use plain text with headers
`;

    // Gemini model
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No response text returned from Gemini");
    }

    return { insights: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI service unavailable.",
    };
  }
}