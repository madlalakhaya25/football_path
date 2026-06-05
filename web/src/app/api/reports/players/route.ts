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

function htmlReport(title: string, subtitle: string, table: string, landscape = false): string {
  const date = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : ""}; margin: 15mm 12mm; }
  @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #111; background: #fff; }
  .page { max-width: 1100px; margin: 0 auto; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 15px; font-weight: 700; }
  .header p { font-size: 10px; color: #666; margin-top: 2px; }
  .meta { font-size: 9px; text-align: right; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
  th { background: #f3f4f6; text-align: left; padding: 5px 6px; font-weight: 700; border: 1px solid #d1d5db; white-space: nowrap; }
  td { padding: 4px 6px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 8px; color: #9ca3af; display: flex; justify-content: space-between; }
  .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 10px 18px; background: #1d4ed8; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div><h1>Growfit Football Academy</h1><p>${title} — ${subtitle}</p></div>
    <div class="meta">Generated: ${date}</div>
  </div>
  ${table}
  <div class="footer"><span>Growfit FA · growfitfa.com · POPIA compliant — handle with care</span><span>${date}</span></div>
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

  const { data: players } = await supabase
    .from("players")
    .select(`
      full_name, position, preferred_foot, date_of_birth, share_token,
      school, home_address, id_number, mysafa_number,
      player_medical ( blood_type, allergies, chronic_conditions, current_medication,
        emergency_1_name, emergency_1_relationship, emergency_1_phone,
        emergency_2_name, emergency_2_relationship, emergency_2_phone,
        has_medical_aid, medical_aid_scheme, medical_aid_number, doctor_clinic, nearest_hospital,
        treatment_authorised, authorised_by ),
      player_consents ( participation_consent, photo_consent, transport_consent, risk_acknowledged, signed_by, signed_at )
    `)
    .eq("academy_id", profile.academy_id)
    .eq("active", true)
    .order("full_name");

  const headers = [
    "Name", "Position", "Foot", "Date of Birth", "Share Token",
    "School", "Home Address", "ID/Birth Cert", "MYSAFA No",
    "Blood Type", "Allergies", "Conditions", "Medication",
    "Emergency 1 Name", "Rel", "Phone", "Emergency 2 Name", "Rel", "Phone",
    "Medical Aid", "Scheme", "Medical Aid No", "Doctor/Clinic", "Nearest Hospital",
    "Treatment Authorised", "Authorised By",
    "Participation Consent", "Photo Consent", "Transport Consent", "Risk Ack",
    "Consents Signed By", "Consents Signed At",
  ];

  const rows = (players ?? []).map((p) => {
    const med = Array.isArray(p.player_medical) ? p.player_medical[0] : p.player_medical;
    const con = Array.isArray(p.player_consents) ? p.player_consents[0] : p.player_consents;
    return [
      p.full_name, p.position, p.preferred_foot, p.date_of_birth, p.share_token,
      p.school, p.home_address, p.id_number, p.mysafa_number,
      med?.blood_type, med?.allergies, med?.chronic_conditions, med?.current_medication,
      med?.emergency_1_name, med?.emergency_1_relationship, med?.emergency_1_phone,
      med?.emergency_2_name, med?.emergency_2_relationship, med?.emergency_2_phone,
      med?.has_medical_aid ? "Yes" : "No",
      med?.medical_aid_scheme, med?.medical_aid_number, med?.doctor_clinic, med?.nearest_hospital,
      med?.treatment_authorised ? "Yes" : "No", med?.authorised_by,
      con?.participation_consent ? "Yes" : "No",
      con?.photo_consent ? "Yes" : "No",
      con?.transport_consent ? "Yes" : "No",
      con?.risk_acknowledged ? "Yes" : "No",
      con?.signed_by,
      con?.signed_at ? new Date(con.signed_at).toLocaleDateString("en-ZA") : "",
    ];
  });

  const date = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const html = htmlReport("Player Records", `${rows.length} active players`, htmlTable(headers, rows), true);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const csv = [csvRow(headers), ...rows.map(csvRow)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="players-${date}.csv"`,
    },
  });
}
