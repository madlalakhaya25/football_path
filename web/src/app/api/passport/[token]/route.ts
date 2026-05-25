import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Use the security-definer RPC so RLS is bypassed for public access
  const { data, error } = await supabase.rpc("get_public_passport", {
    p_share_token: token.toLowerCase(),
  });

  if (error || !data) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  return NextResponse.json({ passport: data }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
