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

  const { data: players } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("academy_id", profile.academy_id)
    .eq("active", true);

  const playerIds = (players ?? []).map((p: { id: string; full_name: string }) => p.id);
  const playerName: Record<string, string> = {};
  for (const p of players ?? []) {
    playerName[(p as { id: string; full_name: string }).id] = (p as { id: string; full_name: string }).full_name;
  }

  const headers = ["Player", "Document", "Season", "Status", "Signed By", "Signed At", "File"];

  if (playerIds.length === 0) {
    const csv = [csvRow(headers)].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-${date}.csv"`,
      },
    });
  }

  const { data: docs } = await supabase
    .from("player_documents")
    .select("player_id, document_type, season, status, signer_name, signed_at, file_name")
    .in("player_id", playerIds);

  const rows = (docs ?? []).map((d) => {
    const docRecord = d as {
      player_id: string;
      document_type: string;
      season: string;
      status: string;
      signer_name: string;
      signed_at: string;
      file_name: string;
    };
    return [
      playerName[docRecord.player_id] ?? docRecord.player_id,
      docRecord.document_type,
      docRecord.season,
      docRecord.status,
      docRecord.signer_name,
      docRecord.signed_at,
      docRecord.file_name,
    ];
  });

  const csv = [csvRow(headers), ...rows.map(csvRow)].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compliance-${date}.csv"`,
    },
  });
}
