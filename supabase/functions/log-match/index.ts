import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogMatchPayload {
  fixture_id: string;
  team_score: number;
  opponent_score: number;
  match_notes?: string;
  appearances: { player_id: string; played: boolean }[];
  ratings: { player_id: string; rating: number; note?: string }[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the calling user's ID from the JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is a coach or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, academy_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['coach', 'admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Only coaches and admins can log results' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: LogMatchPayload = await req.json();
    const { fixture_id, team_score, opponent_score, match_notes, appearances, ratings } = body;

    // Validate inputs
    if (!fixture_id || team_score === undefined || opponent_score === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Upsert match result
    const { error: resultError } = await supabase
      .from('match_results')
      .upsert({
        fixture_id,
        team_score,
        opponent_score,
        match_notes: match_notes ?? null,
        logged_by: user.id,
      }, { onConflict: 'fixture_id' });

    if (resultError) throw resultError;

    // 2. Update fixture status to completed
    const { error: fixtureError } = await supabase
      .from('fixtures')
      .update({ status: 'completed' })
      .eq('id', fixture_id);

    if (fixtureError) throw fixtureError;

    // 3. Upsert appearances
    if (appearances.length > 0) {
      const appearanceRows = appearances.map((a) => ({
        fixture_id,
        player_id: a.player_id,
        played: a.played,
      }));

      const { error: appearanceError } = await supabase
        .from('match_appearances')
        .upsert(appearanceRows, { onConflict: 'fixture_id,player_id' });

      if (appearanceError) throw appearanceError;
    }

    // 4. Upsert player ratings (only for players who played)
    if (ratings.length > 0) {
      const ratingRows = ratings.map((r) => ({
        fixture_id,
        player_id: r.player_id,
        coach_id: user.id,
        rating: r.rating,
        note: r.note ?? null,
      }));

      const { error: ratingError } = await supabase
        .from('player_ratings')
        .upsert(ratingRows, { onConflict: 'fixture_id,player_id,coach_id' });

      if (ratingError) throw ratingError;
    }

    return new Response(
      JSON.stringify({ success: true, fixture_id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message ?? 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
