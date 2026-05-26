-- ══════════════════════════════════════════════════════════════════
-- FootballPath — Migration 004
-- Atomic SECURITY DEFINER function for player profile claim.
-- Bypasses RLS so the lookup always works regardless of whether the
-- player's profile has academy_id set yet.
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION claim_player_profile(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_player_id   UUID;
  v_player_name TEXT;
BEGIN
  -- Lookup: find an active, unclaimed player with this share token
  SELECT id, full_name
  INTO   v_player_id, v_player_name
  FROM   players
  WHERE  share_token  = lower(trim(p_share_token))
  AND    profile_id   IS NULL
  AND    active       = TRUE;

  IF v_player_id IS NULL THEN
    RETURN json_build_object('error', 'Token not found, or this profile has already been claimed.');
  END IF;

  -- Claim: atomically set profile_id only if still unclaimed
  UPDATE players
  SET    profile_id = auth.uid()
  WHERE  id         = v_player_id
  AND    profile_id IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'This profile was just claimed by someone else.');
  END IF;

  RETURN json_build_object('success', TRUE, 'name', v_player_name, 'player_id', v_player_id);
END;
$$;
