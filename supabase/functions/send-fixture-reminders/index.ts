/**
 * Scheduled daily at 8am: notify parents and players about fixtures tomorrow.
 * Deploy: supabase functions deploy send-fixture-reminders
 * Schedule: 0 8 * * * (daily 08:00 UTC)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.headers.get("x-supabase-cron") !== "1") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
  const dayEnd   = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("id, opponent, fixture_date, is_home, venue, team_id, teams ( name, academy_id )")
    .eq("status", "upcoming")
    .gte("fixture_date", dayStart)
    .lte("fixture_date", dayEnd);

  if (!fixtures?.length) return new Response(JSON.stringify({ notified: 0 }), { status: 200 });

  let notified = 0;

  for (const fixture of fixtures) {
    const team = Array.isArray(fixture.teams) ? fixture.teams[0] : fixture.teams;
    if (!team) continue;

    // Find all players in the team and their linked parents
    const { data: members } = await supabase
      .from("team_members")
      .select("player_id, players ( full_name, profile_id )")
      .eq("team_id", fixture.team_id)
      .eq("active", true);

    for (const member of members ?? []) {
      const player = Array.isArray(member.players) ? member.players[0] : member.players;
      if (!player) continue;

      // Notify linked parents
      const { data: parentLinks } = await supabase
        .from("parent_player_links")
        .select("parent_id, profiles!parent_id ( email, full_name )")
        .eq("player_id", member.player_id);

      for (const link of parentLinks ?? []) {
        const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
        if (!profile?.email) continue;
        // TODO: send email via Resend/SendGrid with fixture details
        notified++;
      }
    }
  }

  return new Response(JSON.stringify({ notified, fixtures: fixtures.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
