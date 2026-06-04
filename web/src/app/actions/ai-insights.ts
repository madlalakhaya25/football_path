"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/auth";

// Initialize Gemini (new SDK style)
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

    // Adjusted prompt template to explicitly enforce third-person assessment for coaches
    const prompt = `Analyse the following youth football player data and provide specific, technical coaching insights for a coach's internal team management dashboard.

CRITICAL PERSPECTIVE RULES: 
- Write the analysis entirely in the third person. 
- Refer to the player by name (${player.full_name}) or as "the player". 
- Do not use second-person pronouns ("you", "your", "yours").

Player Profile:
- Name: ${player.full_name}
- Position: ${player.position ?? "Unknown"}
- Age: ${age ?? "Unknown"}

Recent Match Ratings (last 10 fixtures): ${ratingsSummary || "None recorded"}
Attribute Assessments (Average out of 100): ${attributeSummary}
Completed Development Milestones: ${completedMilestones || "None recorded"}

Provide the response using these exact plain text markdown headers:
1. **Strengths** (2-3 specific technical observations based strictly on the data)
2. **Priority development areas** (2-3 actionable training focus areas tailored for team environments)
3. **Recommended drills/activities** (2-3 concrete pitch exercises targeting technical deficits)
4. **Motivational note** (One concise evaluation summary sentence reflecting the player's current performance trajectory)

Keep the total response under 300 words.`;

    // NEW SDK CALL WITH CONFIG PERSONA STEERING
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 600,
        // System instruction forces the model to stay in an objective analytical role
        systemInstruction: "You are an elite youth academy technical director and player development scout who produces internal reports for coaching staff.",
      }
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    return { insights: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI service unavailable.",
    };
  }
}
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

    const prompt = `
You are an expert youth football development coach.

Player: ${player.full_name}
Position: ${player.position ?? "Unknown"}
Age: ${age ?? "Unknown"}

Ratings: ${ratingsSummary || "None"}
Attributes: ${attributeSummary}
Milestones: ${completedMilestones || "None"}

Provide:
1. Strengths
2. Development areas
3. Drills
4. Motivational note

Keep under 300 words.
`;

    // NEW SDK CALL
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    return { insights: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI service unavailable.",
    };
  }
}
