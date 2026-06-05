"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateMatchReport(
  fixtureId: string
): Promise<{ report?: string; error?: string }> {
  try {
    const { supabase } = await requireUser();

    const [fixtureResult, matchResultResult, ratingsResult, attendanceResult] =
      await Promise.all([
        supabase
          .from("fixtures")
          .select("opponent, fixture_date, is_home, venue, status")
          .eq("id", fixtureId)
          .single(),

        supabase
          .from("match_results")
          .select("team_score, opponent_score, match_notes")
          .eq("fixture_id", fixtureId)
          .maybeSingle(),

        supabase
          .from("player_ratings")
          .select("rating, note, players(full_name, position)")
          .eq("fixture_id", fixtureId),

        supabase
          .from("match_attendance")
          .select("player_id, status")
          .eq("fixture_id", fixtureId),
      ]);

    const fixture = fixtureResult.data;
    if (!fixture) return { error: "Fixture not found." };

    const result = matchResultResult.data;
    const ratings = ratingsResult.data ?? [];
    const attendance = attendanceResult.data ?? [];

    const presentCount = attendance.filter(
      (a: { player_id: string; status: string }) => a.status === "present"
    ).length;
    const absentCount = attendance.filter(
      (a: { player_id: string; status: string }) => a.status === "absent"
    ).length;

    const ratingsSummary = ratings
      .map((r: { rating: number; note: string | null; players: { full_name: string; position: string | null } | { full_name: string; position: string | null }[] | null }) => {
        const player = Array.isArray(r.players) ? r.players[0] : r.players;
        return `${player?.full_name ?? "Unknown"} (${player?.position ?? "?"}) — ${r.rating}/5${r.note ? `: "${r.note}"` : ""}`;
      })
      .join("; ");

    const scoreLine = result
      ? fixture.is_home
        ? `${result.team_score} – ${result.opponent_score} (Home)`
        : `${result.opponent_score} – ${result.team_score} (Away)`
      : "Result not recorded";

    const prompt = `You are an elite youth football technical director. Write a post-match team report for the coaching staff.

Match details:
- Opponent: ${fixture.opponent}
- Date: ${fixture.fixture_date}
- Venue: ${fixture.venue ?? "Not specified"}
- Home/Away: ${fixture.is_home ? "Home" : "Away"}
- Score: ${scoreLine}
${result?.match_notes ? `- Match notes: ${result.match_notes}` : ""}
- Player ratings: ${ratingsSummary || "None recorded"}
- Attendance: ${presentCount} present, ${absentCount} absent

CRITICAL RULES:
- Strictly 150-200 words total.
- Use third person throughout.
- Plain text only — no asterisks, no Markdown, no bold formatting.
- Use dashes "-" for list items.
- Use these exact section headers:

1. MATCH SUMMARY:
2. STANDOUT PERFORMERS:
3. AREAS TO IMPROVE:
4. TRAINING FOCUS THIS WEEK:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 600,
        systemInstruction:
          "You are an elite youth academy technical director writing concise, data-driven post-match reports for coaching staff. Plain text only.",
      },
    });

    let text = response.text ?? "";
    text = text.replace(/\*/g, "");

    return { report: text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI service unavailable." };
  }
}
