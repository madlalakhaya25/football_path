"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/auth";

const client = new Anthropic();

export async function getPlayerInsights(playerId: string): Promise<{
  insights?: string;
  error?: string;
}> {
  const { supabase } = await requireUser();

  const [{ data: player }, { data: ratings }, { data: attrs }, { data: milestones }] =
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
        .limit(10),
      supabase
        .from("player_attributes")
        .select("pace, shooting, passing, dribbling, defending, physical")
        .eq("player_id", playerId),
      supabase
        .from("player_milestone_completions")
        .select("template_id, completed_at, development_milestone_templates(title, category)")
        .eq("player_id", playerId)
        .order("completed_at", { ascending: false })
        .limit(20),
    ]);

  if (!player) return { error: "Player not found." };

  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31_557_600_000)
    : null;

  const attrAvg = (key: string) => {
    const rows = attrs ?? [];
    if (!rows.length) return null;
    return Math.round(rows.reduce((s: number, r: Record<string, number>) => s + r[key], 0) / rows.length);
  };

  const attributeSummary = attrs?.length
    ? `Pace ${attrAvg("pace")}, Shooting ${attrAvg("shooting")}, Passing ${attrAvg("passing")}, Dribbling ${attrAvg("dribbling")}, Defending ${attrAvg("defending")}, Physical ${attrAvg("physical")}`
    : "No attribute assessments yet";

  const ratingsSummary = (ratings ?? [])
    .map((r) => {
      const fix = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
      return `${r.rating}/5 vs ${fix?.opponent ?? "training"}${r.note ? ` — "${r.note}"` : ""}`;
    })
    .join("; ");

  const completedMilestones = (milestones ?? [])
    .map((m) => {
      const t = Array.isArray(m.development_milestone_templates) ? m.development_milestone_templates[0] : m.development_milestone_templates;
      return t ? `${t.category}: ${t.title}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const prompt = `You are an expert youth football development coach. Analyse the following player data and provide specific, actionable coaching insights.

Player: ${player.full_name}
Position: ${player.position ?? "Unknown"}
Age: ${age ?? "Unknown"}

Recent match ratings (last 10): ${ratingsSummary || "No ratings yet"}

Attribute assessments (average across coaches, out of 100): ${attributeSummary}

Completed development milestones: ${completedMilestones || "None recorded yet"}

Provide:
1. **Strengths** (2-3 specific observations based on the data)
2. **Priority development areas** (2-3 specific, actionable focus areas for training)
3. **Recommended drills/activities** (2-3 concrete exercises that address the weaknesses)
4. **Motivational note** (one sentence to share with the player)

Be specific to the position and age. Base insights strictly on the data provided. Keep the total response under 300 words. Use plain text with the bold headers shown above.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    return { insights: text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI service unavailable." };
  }
}
