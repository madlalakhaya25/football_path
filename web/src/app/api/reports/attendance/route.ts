import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(",");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("academy_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin")
    return new NextResponse("Forbidden", { status: 403 });

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("academy_id", profile.academy_id);
  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);

  if (teamIds.length === 0) {
    const csv = [csvRow(["Session", "Date", "Type", "Team", "Player", "Status"])].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
      },
    });
  }

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select(`
      title, session_date, session_type,
      teams ( name ),
      training_attendance (
        status,
        players ( full_name )
      )
    `)
    .in("team_id", teamIds)
    .order("session_date", { ascending: false });

  const headers = ["Session", "Date", "Type", "Team", "Player", "Status"];

  const rows: unknown[][] = [];
  for (const session of sessions ?? []) {
    const teamName =
      session.teams && !Array.isArray(session.teams)
        ? (session.teams as { name: string }).name
        : Array.isArray(session.teams) && session.teams.length > 0
        ? (session.teams[0] as { name: string }).name
        : "";

    const attendance = Array.isArray(session.training_attendance)
      ? session.training_attendance
      : [];

    if (attendance.length === 0) {
      rows.push([session.title, session.session_date, session.session_type, teamName, "", ""]);
    } else {
      for (const att of attendance) {
        const attRecord = att as { status: string; players: { full_name: string } | { full_name: string }[] | null };
        const playerName =
          attRecord.players && !Array.isArray(attRecord.players)
            ? (attRecord.players as { full_name: string }).full_name
            : Array.isArray(attRecord.players) && attRecord.players.length > 0
            ? (attRecord.players[0] as { full_name: string }).full_name
            : "";
        rows.push([
          session.title,
          session.session_date,
          session.session_type,
          teamName,
          playerName,
          attRecord.status,
        ]);
      }
    }
  }

  const csv = [csvRow(headers), ...rows.map(csvRow)].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
    },
  });
}
