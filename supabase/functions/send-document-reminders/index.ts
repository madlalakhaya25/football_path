/**
 * Scheduled daily: remind parents who have unsigned documents for the current season.
 * Deploy: supabase functions deploy send-document-reminders
 * Schedule via Supabase Dashboard → Edge Functions → Schedules (cron: 0 9 * * 1)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOTAL_DOCS = 6;

Deno.serve(async (req) => {
  // Allow cron invocations and manual POST triggers
  if (req.method !== "POST" && req.headers.get("x-supabase-cron") !== "1") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const season = new Date().getFullYear().toString();

  // Find all parent_player_links where the child has incomplete docs this season
  const { data: links } = await supabase
    .from("parent_player_links")
    .select(`
      parent_id,
      player_id,
      players ( full_name ),
      profiles!parent_id ( email, full_name )
    `);

  if (!links?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  // Get doc completion counts
  const playerIds = [...new Set(links.map((l: { player_id: string }) => l.player_id))];
  const { data: docs } = await supabase
    .from("player_documents")
    .select("player_id, status")
    .in("player_id", playerIds)
    .eq("season", season)
    .in("status", ["signed", "uploaded"]);

  const docCountMap = new Map<string, number>();
  for (const d of docs ?? []) {
    docCountMap.set(d.player_id, (docCountMap.get(d.player_id) ?? 0) + 1);
  }

  let sent = 0;
  const reminders: { email: string; parentName: string; playerName: string; missing: number }[] = [];

  for (const link of links) {
    const complete = docCountMap.get(link.player_id) ?? 0;
    if (complete >= TOTAL_DOCS) continue;

    const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
    const player = Array.isArray(link.players) ? link.players[0] : link.players;
    if (!profile?.email) continue;

    reminders.push({
      email: profile.email,
      parentName: profile.full_name ?? "Parent",
      playerName: player?.full_name ?? "your child",
      missing: TOTAL_DOCS - complete,
    });
  }

  // Send emails via Supabase Auth admin API (uses configured SMTP)
  for (const r of reminders) {
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: r.email,
      options: {
        data: {
          reminder_type: "document",
          player_name: r.playerName,
          missing_count: r.missing,
        },
        // redirectTo: your app URL + /dashboard/parent
      },
    });
    // TODO: Replace with Resend/SendGrid for custom email templates
    sent++;
  }

  return new Response(JSON.stringify({ sent, season }), {
    headers: { "Content-Type": "application/json" },
  });
});
