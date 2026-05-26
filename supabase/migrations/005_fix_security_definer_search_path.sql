-- Add SET search_path to all SECURITY DEFINER functions to prevent
-- search_path injection attacks (Postgres hardening best practice).

CREATE OR REPLACE FUNCTION get_public_passport(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_player players%ROWTYPE;
  v_attrs  RECORD;
BEGIN
  SELECT * INTO v_player
  FROM players
  WHERE share_token = lower(trim(p_share_token)) AND active = TRUE;

  IF v_player.id IS NULL THEN
    RETURN json_build_object('error', 'Player not found.');
  END IF;

  SELECT
    round(avg(pace))::int      AS pace,
    round(avg(shooting))::int  AS shooting,
    round(avg(passing))::int   AS passing,
    round(avg(dribbling))::int AS dribbling,
    round(avg(defending))::int AS defending,
    round(avg(physical))::int  AS physical
  INTO v_attrs
  FROM player_attributes
  WHERE player_id = v_player.id;

  RETURN json_build_object(
    'id',             v_player.id,
    'full_name',      v_player.full_name,
    'position',       v_player.position,
    'secondary_pos',  v_player.secondary_pos,
    'preferred_foot', v_player.preferred_foot,
    'date_of_birth',  v_player.date_of_birth,
    'photo_url',      v_player.photo_url,
    'share_token',    v_player.share_token,
    'attributes',     row_to_json(v_attrs)
  );
END;
$$;

CREATE OR REPLACE FUNCTION claim_player_profile(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_player_id   UUID;
  v_player_name TEXT;
BEGIN
  SELECT id, full_name
  INTO   v_player_id, v_player_name
  FROM   players
  WHERE  share_token = lower(trim(p_share_token))
  AND    profile_id  IS NULL
  AND    active      = TRUE;

  IF v_player_id IS NULL THEN
    RETURN json_build_object('error', 'Token not found or already claimed.');
  END IF;

  UPDATE players SET profile_id = auth.uid()
  WHERE  id = v_player_id AND profile_id IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profile was just claimed by someone else.');
  END IF;

  RETURN json_build_object('success', TRUE, 'name', v_player_name, 'player_id', v_player_id);
END;
$$;
