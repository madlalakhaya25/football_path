"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateAcademyHealthReport(): Promise<{
  report?: string;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();

    // Fetch academy_id from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("academy_id")
      .eq("id", user.id)
      .single();

    if (!profile?.academy_id) return { error: "Academy not found." };
    const academyId = profile.academy_id;

    const currentYear = new Date().getFullYear().toString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Fetch active players
    const { data: activePlayers } = await supabase
      .from("players")
      .select("id, position")
      .eq("academy_id", academyId)
      .eq("active", true);

    const activePlayerList = activePlayers ?? [];
    const totalActivePlayers = activePlayerList.length;
    const activePlayerIds = activePlayerList.map((p: { id: string }) => p.id);

    // Players by position
    const positionCounts: Record<string, number> = {};
    for (const p of activePlayerList as { id: string; position: string | null }[]) {
      const pos = p.position ?? "Unknown";
      positionCounts[pos] = (positionCounts[pos] ?? 0) + 1;
    }

    // Document compliance: signed or uploaded docs this season
    const { data: docsRaw } = await supabase
      .from("player_documents")
      .select("player_id, status")
      .eq("season", currentYear)
      .in("status", ["signed", "uploaded"])
      .in("player_id", activePlayerIds.length ? activePlayerIds : [""]);

    const signedDocCount = (docsRaw ?? []).length;
    const totalExpectedDocs = totalActivePlayers * 6;
    const compliancePct =
      totalExpectedDocs > 0
        ? Math.round((signedDocCount / totalExpectedDocs) * 100)
        : 0;

    // Average player rating last 30 days via player_ids
    const { data: recentRatings } = await supabase
      .from("player_ratings")
      .select("rating, player_id")
      .in("player_id", activePlayerIds.length ? activePlayerIds : [""])
      .gte("created_at", thirtyDaysAgo);

    const recentRatingList = recentRatings ?? [];
    const avgRating =
      recentRatingList.length > 0
        ? (
            recentRatingList.reduce(
              (sum: number, r: { rating: number }) => sum + r.rating,
              0
            ) / recentRatingList.length
          ).toFixed(2)
        : "N/A";

    // Training sessions this month — via teams.academy_id
    const { data: sessionsRaw } = await supabase
      .from("training_sessions")
      .select("id, team_id, teams ( academy_id )")
      .gte("session_date", monthStart);

    const trainingSessionsThisMonth = (sessionsRaw ?? []).filter(
      (s: { teams: { academy_id: string } | { academy_id: string }[] | null }) => {
        const t = Array.isArray(s.teams) ? s.teams[0] : s.teams;
        return t?.academy_id === academyId;
      }
    ).length;

    // Milestones completed this season via player_ids
    const { data: milestonesRaw } = await supabase
      .from("player_milestone_completions")
      .select("id")
      .in("player_id", activePlayerIds.length ? activePlayerIds : [""])
      .eq("season", currentYear);

    const milestonesCompleted = (milestonesRaw ?? []).length;

    // Top 3 rated players last 30 days
    const { data: topRatingsRaw } = await supabase
      .from("player_ratings")
      .select("player_id, rating, players ( full_name )")
      .in("player_id", activePlayerIds.length ? activePlayerIds : [""])
      .gte("created_at", thirtyDaysAgo);

    type TopRow = {
      player_id: string;
      rating: number;
      players: { full_name: string } | { full_name: string }[] | null;
    };
    const playerRatingMap = new Map<string, { name: string; ratings: number[] }>();
    for (const row of (topRatingsRaw as TopRow[] ?? [])) {
      const p = Array.isArray(row.players) ? row.players[0] : row.players;
      if (!p) continue;
      const cur = playerRatingMap.get(row.player_id) ?? { name: p.full_name, ratings: [] };
      cur.ratings.push(row.rating);
      playerRatingMap.set(row.player_id, cur);
    }
    const top3 = Array.from(playerRatingMap.values())
      .map(({ name, ratings }) => ({
        name,
        avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);

    // Players with no recent rating in last 30 days
    const ratedPlayerIds = new Set(
      recentRatingList.map((r: { player_id: string }) => r.player_id)
    );
    const noRecentRatingCount = activePlayerIds.filter(
      (id: string) => !ratedPlayerIds.has(id)
    ).length;

    // Build position summary string
    const positionSummary =
      Object.entries(positionCounts)
        .map(([pos, count]) => `${pos}: ${count}`)
        .join(", ") || "No data";

    // Build top performers string
    const topPerformersStr =
      top3.length > 0
        ? top3.map(({ name, avg }) => `${name} (${avg.toFixed(2)})`).join(", ")
        : "None recorded";

    const prompt = `You are an experienced football academy director. Analyse the following academy data and provide a strategic monthly health report.

ACADEMY METRICS:
- Total active players: ${totalActivePlayers}
- Position breakdown: ${positionSummary}
- Document compliance: ${compliancePct}% (${signedDocCount} of ${totalExpectedDocs} documents complete)
- Average player rating this month: ${avgRating}/5
- Training sessions this month: ${trainingSessionsThisMonth}
- Milestones completed this season: ${milestonesCompleted}
- Top performers: ${topPerformersStr}
- Players needing attention (no recent rating): ${noRecentRatingCount}

Output format (plain text, no markdown, no asterisks):
1. ACADEMY OVERVIEW: (2 sentences on current academy health)
2. STRENGTHS: (2 specific positives backed by the data)
3. CONCERNS: (2 areas needing attention)
4. PRIORITY ACTIONS: (3 specific actions for the admin/coaching staff this month)
5. DIRECTOR'S NOTE: (one forward-looking sentence about the academy's trajectory)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 700,
        systemInstruction:
          "You are an experienced football academy director providing strategic insights.",
      },
    });

    let text = response.text ?? "";
    text = text.replace(/\*/g, "");

    return { report: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI service unavailable.",
    };
  }
}
