import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(",");
}

function htmlTable(headers: string[], rows: unknown[][]): string {
  const th = headers.map((h) => `<th>${h}</th>`).join("");
  const trs = rows.map((r) =>
    `<tr>${r.map((c) => `<td>${c == null ? "" : String(c)}</td>`).join("")}</tr>`
  ).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

function htmlReport(title: string, subtitle: string, table: string): string {
  const date = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 16px; font-weight: 700; }
  .header p { font-size: 11px; color: #666; margin-top: 2px; }
  .meta { font-size: 10px; text-align: right; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-weight: 700; border: 1px solid #d1d5db; white-space: nowrap; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
  .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 10px 18px; background: #1d4ed8; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div><h1>Growfit Football Academy</h1><p>${title} — ${subtitle}</p></div>
    <div class="meta">Generated: ${date}</div>
  </div>
  ${table}
  <div class="footer"><span>Growfit FA · growfitfa.com</span><span>${date}</span></div>
</div>
<button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
<script>setTimeout(function(){ window.print(); }, 800);</script>
</body></html>`;
}

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format");
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

  const headers = ["Session", "Date", "Type", "Team", "Player", "Status"];
  const rows: unknown[][] = [];

  if (teamIds.length > 0) {
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
          rows.push([session.title, session.session_date, session.session_type, teamName, playerName, attRecord.status]);
        }
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const html = htmlReport("Training Attendance Report", `${rows.length} records`, htmlTable(headers, rows));
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const csv = [csvRow(headers), ...rows.map(csvRow)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
    },
  });
}
