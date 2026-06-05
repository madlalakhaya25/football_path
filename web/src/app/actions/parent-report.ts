"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateParentReport(
  playerId: string
): Promise<{ report?: string; error?: string }> {
  try {
    const { supabase } = await requireUser();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [playerResult, ratingsResult, attrsResult, milestonesResult, trainingAttendanceResult] =
      await Promise.all([
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
          .limit(6),

        supabase
          .from("player_attributes")
          .select("pace, shooting, passing, dribbling, defending, physical")
          .eq("player_id", playerId),

        supabase
          .from("player_milestone_completions")
          .select("completed_at, development_milestone_templates(title, category)")
          .eq("player_id", playerId)
          .order("completed_at", { ascending: false })
          .limit(5),

        supabase
          .from("training_attendance")
          .select("player_id, status, created_at")
          .eq("player_id", playerId)
          .gte("created_at", thirtyDaysAgo),
      ]);

    const player = playerResult.data;
    if (!player) return { error: "Player not found." };

    const ratings = ratingsResult.data ?? [];
    const attrs = attrsResult.data ?? [];
    const milestones = milestonesResult.data ?? [];
    const trainingAttendance = trainingAttendanceResult.data ?? [];

    const age = player.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(player.date_of_birth).getTime()) / 31_557_600_000
        )
      : null;

    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / ratings.length).toFixed(1)
        : null;

    const ratingsSummary = ratings
      .map((r: { rating: number; note: string | null; fixtures: { opponent: string; fixture_date: string } | { opponent: string; fixture_date: string }[] | null }) => {
        const fix = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
        return `${r.rating}/5 vs ${fix?.opponent ?? "training"}${r.note ? ` ("${r.note}")` : ""}`;
      })
      .join("; ");

    const attrRows = attrs as Record<string, number>[];
    const avg = (key: string) =>
      attrRows.length
        ? Math.round(attrRows.reduce((s, r) => s + (r[key] ?? 0), 0) / attrRows.length)
        : null;

    const attributeSummary =
      attrRows.length > 0
        ? `Pace ${avg("pace")}, Shooting ${avg("shooting")}, Passing ${avg("passing")}, Dribbling ${avg("dribbling")}, Defending ${avg("defending")}, Physical ${avg("physical")}`
        : "No attribute assessments yet";

    const milestonesList = milestones
      .map((m: { completed_at: string; development_milestone_templates: { title: string; category: string } | { title: string; category: string }[] | null }) => {
        const t = Array.isArray(m.development_milestone_templates)
          ? m.development_milestone_templates[0]
          : m.development_milestone_templates;
        return t ? `${t.category}: ${t.title}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const attendingCount = trainingAttendance.filter(
      (a: { status: string }) => a.status === "attending"
    ).length;

    const prompt = `You are a professional youth football academy coach. Write a warm, encouraging progress report letter addressed to the parent of ${player.full_name}.

Player data:
- Name: ${player.full_name}
- Position: ${player.position ?? "Not specified"}
${age ? `- Age: ${age}` : ""}
- Recent match ratings (last 6): ${ratingsSummary || "No recent ratings"}
- Average rating: ${avgRating ? `${avgRating}/5` : "Not available"}
- Attributes (out of 100): ${attributeSummary}
- Recent milestones achieved: ${milestonesList || "None recorded yet"}
- Training sessions attended (last 30 days): ${attendingCount}

CRITICAL RULES:
- Strictly 150-200 words total.
- Written in first person plural ("we", "our") as the coaching staff writing to the parent.
- Refer to the player as "${player.full_name}" and "your child".
- Warm and encouraging tone throughout.
- No negative language — reframe weaknesses as growth areas.
- Plain text only — no asterisks, no Markdown, no bold formatting.
- Use dashes "-" for list items.
- Use these exact section headers:

1. OVERALL PROGRESS:
2. STRENGTHS WE'VE NOTICED:
3. AREAS WE'RE WORKING ON:
4. UPCOMING FOCUS:
5. FROM THE COACHING STAFF:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 600,
        systemInstruction:
          "You are a professional youth football academy coach writing warm, encouraging progress reports for parents. Plain text only — no asterisks, no Markdown.",
      },
    });

    let text = response.text ?? "";
    text = text.replace(/\*/g, "");

    return { report: text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI service unavailable." };
  }
}
