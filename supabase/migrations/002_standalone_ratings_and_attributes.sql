-- ══════════════════════════════════════════════════════════════════
-- FootballPath — Migration 002
-- Standalone ratings + player ability attributes
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Make fixture_id nullable on player_ratings
--    (allows ratings not tied to a specific fixture)
-- ─────────────────────────────────────────

ALTER TABLE player_ratings
  ALTER COLUMN fixture_id DROP NOT NULL;

-- Drop the old unique constraint (included fixture_id)
ALTER TABLE player_ratings
  DROP CONSTRAINT IF EXISTS player_ratings_fixture_id_player_id_coach_id_key;

-- Partial unique index: enforce uniqueness only for fixture-linked ratings
CREATE UNIQUE INDEX IF NOT EXISTS player_ratings_fixture_unique
  ON player_ratings (fixture_id, player_id, coach_id)
  WHERE fixture_id IS NOT NULL;

-- ─────────────────────────────────────────
-- 2. Add delete policy for ratings (coaches can delete their own)
-- ─────────────────────────────────────────

DROP POLICY IF EXISTS "rating_coach_delete" ON player_ratings;
CREATE POLICY "rating_coach_delete" ON player_ratings
  FOR DELETE USING (coach_id = auth.uid());

-- ─────────────────────────────────────────
-- 3. Update staff read policy to cover both fixture and standalone ratings
-- ─────────────────────────────────────────

DROP POLICY IF EXISTS "rating_staff_read" ON player_ratings;
CREATE POLICY "rating_staff_read" ON player_ratings
  FOR SELECT USING (
    is_admin_or_coach() AND (
      -- fixture-linked: check via fixtures → teams → academy
      (fixture_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM fixtures f
        JOIN teams t ON t.id = f.team_id
        WHERE f.id = player_ratings.fixture_id
        AND t.academy_id = auth_academy_id()
      ))
      OR
      -- standalone: check player's academy directly
      (fixture_id IS NULL AND EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = player_ratings.player_id
        AND p.academy_id = auth_academy_id()
      ))
    )
  );

-- ─────────────────────────────────────────
-- 4. Player attributes table
--    One row per (player, coach) — upserted on each assessment
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_attributes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pace         SMALLINT NOT NULL DEFAULT 50 CHECK (pace     BETWEEN 1 AND 99),
  shooting     SMALLINT NOT NULL DEFAULT 50 CHECK (shooting BETWEEN 1 AND 99),
  passing      SMALLINT NOT NULL DEFAULT 50 CHECK (passing  BETWEEN 1 AND 99),
  dribbling    SMALLINT NOT NULL DEFAULT 50 CHECK (dribbling BETWEEN 1 AND 99),
  defending    SMALLINT NOT NULL DEFAULT 50 CHECK (defending BETWEEN 1 AND 99),
  physical     SMALLINT NOT NULL DEFAULT 50 CHECK (physical BETWEEN 1 AND 99),
  notes        TEXT CHECK (char_length(notes) <= 300),
  assessed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, coach_id)
);

ALTER TABLE player_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attrs_coach_insert" ON player_attributes
  FOR INSERT WITH CHECK (coach_id = auth.uid() AND is_admin_or_coach());

CREATE POLICY "attrs_coach_update" ON player_attributes
  FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "attrs_coach_delete" ON player_attributes
  FOR DELETE USING (coach_id = auth.uid());

CREATE POLICY "attrs_staff_read" ON player_attributes
  FOR SELECT USING (
    is_admin_or_coach() AND EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_attributes.player_id
      AND p.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "attrs_player_read" ON player_attributes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_attributes.player_id
      AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "attrs_parent_read" ON player_attributes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_player_links ppl
      WHERE ppl.parent_id = auth.uid()
      AND ppl.player_id = player_attributes.player_id
    )
  );

-- ─────────────────────────────────────────
-- 5. Update get_public_passport to include real attributes
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_public_passport(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id',                p.id,
    'share_token',       p.share_token,
    'full_name',         p.full_name,
    'position',          p.position,
    'secondary_pos',     p.secondary_pos,
    'preferred_foot',    p.preferred_foot,
    'photo_url',         p.photo_url,
    'date_of_birth',     p.date_of_birth::TEXT,
    'team_name',         t.name,
    'academy_name',      a.name,
    'ratings', (
      SELECT COALESCE(json_agg(r ORDER BY r.created_at DESC), '[]'::json)
      FROM (
        SELECT
          pr.rating,
          pr.note,
          pr.created_at,
          f.opponent,
          f.fixture_date
        FROM player_ratings pr
        LEFT JOIN fixtures f ON f.id = pr.fixture_id
        WHERE pr.player_id = p.id
        ORDER BY pr.created_at DESC
      ) r
    ),
    'attributes', (
      SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE
        json_build_object(
          'pace',      ROUND(AVG(pace))::INT,
          'shooting',  ROUND(AVG(shooting))::INT,
          'passing',   ROUND(AVG(passing))::INT,
          'dribbling', ROUND(AVG(dribbling))::INT,
          'defending', ROUND(AVG(defending))::INT,
          'physical',  ROUND(AVG(physical))::INT
        )
      END
      FROM player_attributes
      WHERE player_id = p.id
    )
  )
  INTO result
  FROM players p
  LEFT JOIN team_members tm ON tm.player_id = p.id AND tm.active = TRUE
  LEFT JOIN teams t ON t.id = tm.team_id
  LEFT JOIN academies a ON a.id = p.academy_id
  WHERE p.share_token = p_share_token
  AND p.active = TRUE;

  RETURN result;
END;
$$;
