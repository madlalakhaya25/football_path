-- ══════════════════════════════════════════════════════════════════
-- FootballPath — Complete Schema
-- Apply once to a fresh Supabase project (SQL Editor or supabase db push).
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  location    TEXT,
  province    TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id  UUID        REFERENCES academies(id) ON DELETE SET NULL,
  role        TEXT        NOT NULL CHECK (role IN ('admin','coach','player','parent')),
  full_name   TEXT        NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  academy_id      UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  date_of_birth   DATE,
  position        TEXT        CHECK (position IN ('goalkeeper','defender','midfielder','winger','striker')),
  secondary_pos   TEXT        CHECK (secondary_pos IN ('goalkeeper','defender','midfielder','winger','striker')),
  preferred_foot  TEXT        CHECK (preferred_foot IN ('left','right','both')),
  photo_url       TEXT,
  share_token     TEXT        UNIQUE NOT NULL DEFAULT substr(encode(gen_random_bytes(6),'hex'),1,10),
  active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  age_group   TEXT,
  coach_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code TEXT        UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(3),'hex'),1,6)),
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id    UUID        NOT NULL REFERENCES teams(id)   ON DELETE CASCADE,
  player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (team_id, player_id)
);

CREATE TABLE IF NOT EXISTS parent_player_links (
  parent_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id  UUID        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  linked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_id, player_id)
);

CREATE TABLE IF NOT EXISTS fixtures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent      TEXT        NOT NULL,
  venue         TEXT,
  fixture_date  TIMESTAMPTZ NOT NULL,
  is_home       BOOLEAN     NOT NULL DEFAULT TRUE,
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming','completed','cancelled','postponed')),
  notes         TEXT,
  created_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_results (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id      UUID        NOT NULL UNIQUE REFERENCES fixtures(id) ON DELETE CASCADE,
  team_score      SMALLINT    NOT NULL DEFAULT 0 CHECK (team_score     >= 0),
  opponent_score  SMALLINT    NOT NULL DEFAULT 0 CHECK (opponent_score >= 0),
  match_notes     TEXT,
  logged_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_appearances (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id  UUID     NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id   UUID     NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  played      BOOLEAN  NOT NULL DEFAULT TRUE,
  UNIQUE (fixture_id, player_id)
);

-- fixture_id is nullable — ratings can be standalone (not tied to a fixture)
CREATE TABLE IF NOT EXISTS player_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id  UUID        REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id   UUID        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  coach_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note        TEXT        CHECK (char_length(note) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness enforced only for fixture-linked ratings
CREATE UNIQUE INDEX IF NOT EXISTS player_ratings_fixture_unique
  ON player_ratings (fixture_id, player_id, coach_id)
  WHERE fixture_id IS NOT NULL;

-- One row per (player, coach) — upserted on each assessment
CREATE TABLE IF NOT EXISTS player_attributes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  coach_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pace        SMALLINT    NOT NULL DEFAULT 50 CHECK (pace      BETWEEN 1 AND 99),
  shooting    SMALLINT    NOT NULL DEFAULT 50 CHECK (shooting  BETWEEN 1 AND 99),
  passing     SMALLINT    NOT NULL DEFAULT 50 CHECK (passing   BETWEEN 1 AND 99),
  dribbling   SMALLINT    NOT NULL DEFAULT 50 CHECK (dribbling BETWEEN 1 AND 99),
  defending   SMALLINT    NOT NULL DEFAULT 50 CHECK (defending BETWEEN 1 AND 99),
  physical    SMALLINT    NOT NULL DEFAULT 50 CHECK (physical  BETWEEN 1 AND 99),
  notes       TEXT        CHECK (char_length(notes) <= 300),
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, coach_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID        NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
  coach_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL CHECK (char_length(body) <= 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (NEW.id, 'player', COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE academies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures            ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_appearances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_attributes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- RLS HELPER FUNCTIONS
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_academy_id()
RETURNS UUID LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_or_coach()
RETURNS BOOLEAN LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT role IN ('admin','coach') FROM profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────
-- POLICIES: academies
-- ─────────────────────────────────────────

CREATE POLICY "academy_read_own"  ON academies FOR SELECT USING (id = auth_academy_id());
CREATE POLICY "academy_admin_all" ON academies FOR ALL    USING (id = auth_academy_id() AND auth_role() = 'admin');

-- ─────────────────────────────────────────
-- POLICIES: profiles
-- ─────────────────────────────────────────

CREATE POLICY "profile_read_own"    ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profile_update_own"  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profile_admin_read"  ON profiles FOR SELECT USING (academy_id = auth_academy_id() AND auth_role() = 'admin');
CREATE POLICY "profile_coach_read"  ON profiles FOR SELECT USING (academy_id = auth_academy_id() AND auth_role() = 'coach');

-- ─────────────────────────────────────────
-- POLICIES: players
-- ─────────────────────────────────────────

CREATE POLICY "player_academy_read" ON players FOR SELECT USING (academy_id = auth_academy_id());
CREATE POLICY "player_self_read"    ON players FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "player_parent_read"  ON players FOR SELECT USING (
  EXISTS (SELECT 1 FROM parent_player_links WHERE parent_id = auth.uid() AND player_id = players.id)
);
CREATE POLICY "player_staff_write"  ON players FOR INSERT WITH CHECK (academy_id = auth_academy_id() AND is_admin_or_coach());
CREATE POLICY "player_staff_update" ON players FOR UPDATE USING   (academy_id = auth_academy_id() AND is_admin_or_coach());

-- Allows a player to claim an unclaimed record via share token
CREATE POLICY "player_self_claim" ON players
  FOR UPDATE
  USING     (profile_id IS NULL)
  WITH CHECK (profile_id = auth.uid() AND auth_role() = 'player');

-- ─────────────────────────────────────────
-- POLICIES: teams
-- ─────────────────────────────────────────

CREATE POLICY "team_read_academy"  ON teams FOR SELECT USING    (academy_id = auth_academy_id());
CREATE POLICY "team_staff_write"   ON teams FOR INSERT WITH CHECK (academy_id = auth_academy_id() AND is_admin_or_coach());
CREATE POLICY "team_staff_update"  ON teams FOR UPDATE USING    (academy_id = auth_academy_id() AND is_admin_or_coach());

-- ─────────────────────────────────────────
-- POLICIES: team_members
-- ─────────────────────────────────────────

CREATE POLICY "team_member_read" ON team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "team_member_staff_write" ON team_members FOR INSERT WITH CHECK (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "team_member_staff_delete" ON team_members FOR DELETE USING (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.academy_id = auth_academy_id())
);

-- ─────────────────────────────────────────
-- POLICIES: parent_player_links
-- ─────────────────────────────────────────

CREATE POLICY "parent_link_own"    ON parent_player_links FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "parent_link_insert" ON parent_player_links FOR INSERT WITH CHECK (parent_id = auth.uid() AND auth_role() = 'parent');
CREATE POLICY "parent_link_delete" ON parent_player_links FOR DELETE USING (parent_id = auth.uid());
CREATE POLICY "parent_link_admin"  ON parent_player_links FOR ALL    USING (auth_role() = 'admin');

-- ─────────────────────────────────────────
-- POLICIES: fixtures
-- ─────────────────────────────────────────

CREATE POLICY "fixture_read_academy" ON fixtures FOR SELECT USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = fixtures.team_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "fixture_staff_write" ON fixtures FOR INSERT WITH CHECK (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM teams t WHERE t.id = fixtures.team_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "fixture_staff_update" ON fixtures FOR UPDATE USING (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM teams t WHERE t.id = fixtures.team_id AND t.academy_id = auth_academy_id())
);

-- ─────────────────────────────────────────
-- POLICIES: match_results
-- ─────────────────────────────────────────

CREATE POLICY "result_read_academy" ON match_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id WHERE f.id = match_results.fixture_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "result_staff_write" ON match_results FOR INSERT WITH CHECK (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id WHERE f.id = match_results.fixture_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "result_staff_update" ON match_results FOR UPDATE USING (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id WHERE f.id = match_results.fixture_id AND t.academy_id = auth_academy_id())
);

-- ─────────────────────────────────────────
-- POLICIES: match_appearances
-- ─────────────────────────────────────────

CREATE POLICY "appearance_read_academy" ON match_appearances FOR SELECT USING (
  EXISTS (SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id WHERE f.id = match_appearances.fixture_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "appearance_staff_write" ON match_appearances FOR INSERT WITH CHECK (
  is_admin_or_coach() AND
  EXISTS (SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id WHERE f.id = match_appearances.fixture_id AND t.academy_id = auth_academy_id())
);

-- ─────────────────────────────────────────
-- POLICIES: player_ratings
-- ─────────────────────────────────────────

CREATE POLICY "rating_coach_insert" ON player_ratings FOR INSERT WITH CHECK (coach_id = auth.uid() AND is_admin_or_coach());
CREATE POLICY "rating_coach_update" ON player_ratings FOR UPDATE USING (coach_id = auth.uid());
CREATE POLICY "rating_coach_delete" ON player_ratings FOR DELETE USING (coach_id = auth.uid());

CREATE POLICY "rating_player_read" ON player_ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM players p WHERE p.id = player_ratings.player_id AND p.profile_id = auth.uid())
);
CREATE POLICY "rating_parent_read" ON player_ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM parent_player_links ppl WHERE ppl.parent_id = auth.uid() AND ppl.player_id = player_ratings.player_id)
);
-- Covers both fixture-linked and standalone ratings
CREATE POLICY "rating_staff_read" ON player_ratings FOR SELECT USING (
  is_admin_or_coach() AND (
    (fixture_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM fixtures f JOIN teams t ON t.id = f.team_id
      WHERE f.id = player_ratings.fixture_id AND t.academy_id = auth_academy_id()
    ))
    OR
    (fixture_id IS NULL AND EXISTS (
      SELECT 1 FROM players p WHERE p.id = player_ratings.player_id AND p.academy_id = auth_academy_id()
    ))
  )
);

-- ─────────────────────────────────────────
-- POLICIES: player_attributes
-- ─────────────────────────────────────────

CREATE POLICY "attrs_coach_insert" ON player_attributes FOR INSERT WITH CHECK (coach_id = auth.uid() AND is_admin_or_coach());
CREATE POLICY "attrs_coach_update" ON player_attributes FOR UPDATE USING (coach_id = auth.uid());
CREATE POLICY "attrs_coach_delete" ON player_attributes FOR DELETE USING (coach_id = auth.uid());
CREATE POLICY "attrs_staff_read"   ON player_attributes FOR SELECT USING (
  is_admin_or_coach() AND EXISTS (SELECT 1 FROM players p WHERE p.id = player_attributes.player_id AND p.academy_id = auth_academy_id())
);
CREATE POLICY "attrs_player_read"  ON player_attributes FOR SELECT USING (
  EXISTS (SELECT 1 FROM players p WHERE p.id = player_attributes.player_id AND p.profile_id = auth.uid())
);
CREATE POLICY "attrs_parent_read"  ON player_attributes FOR SELECT USING (
  EXISTS (SELECT 1 FROM parent_player_links ppl WHERE ppl.parent_id = auth.uid() AND ppl.player_id = player_attributes.player_id)
);

-- ─────────────────────────────────────────
-- POLICIES: announcements
-- ─────────────────────────────────────────

CREATE POLICY "announcement_read_academy" ON announcements FOR SELECT USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = announcements.team_id AND t.academy_id = auth_academy_id())
);
CREATE POLICY "announcement_coach_write" ON announcements FOR INSERT WITH CHECK (
  coach_id = auth.uid() AND is_admin_or_coach()
);

-- ─────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────

-- Public passport — no auth required, bypasses RLS via SECURITY DEFINER.
-- Returns player info + averaged attributes for the share page.
CREATE OR REPLACE FUNCTION get_public_passport(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
    'attributes',     row_to_json(v_attrs),
    'ratings', (
      SELECT COALESCE(json_agg(r ORDER BY r.created_at DESC), '[]'::json)
      FROM (
        SELECT pr.rating, pr.note, pr.created_at,
               f.opponent, f.fixture_date
        FROM player_ratings pr
        LEFT JOIN fixtures f ON f.id = pr.fixture_id
        WHERE pr.player_id = v_player.id
        ORDER BY pr.created_at DESC
      ) r
    )
  );
END;
$$;

-- Atomically links an authenticated user's profile to an unclaimed player record.
CREATE OR REPLACE FUNCTION claim_player_profile(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_player_id   UUID;
  v_player_name TEXT;
BEGIN
  SELECT id, full_name INTO v_player_id, v_player_name
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

-- Atomic match logging — all writes (result, status, appearances, ratings) in one transaction.
-- Verifies that the calling user owns the fixture's team before writing.
CREATE OR REPLACE FUNCTION log_match_result(
  p_fixture_id     UUID,
  p_team_score     INTEGER,
  p_opponent_score INTEGER,
  p_match_notes    TEXT    DEFAULT NULL,
  p_appearances    JSONB   DEFAULT '[]',
  p_ratings        JSONB   DEFAULT '[]'
)
RETURNS JSON LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM fixtures f
    JOIN   teams   t ON t.id = f.team_id
    WHERE  f.id       = p_fixture_id
    AND    t.coach_id = auth.uid()
    AND    t.active   = TRUE
  ) THEN
    RETURN json_build_object('error', 'Fixture not found.');
  END IF;

  INSERT INTO match_results (fixture_id, team_score, opponent_score, match_notes, logged_by)
  VALUES (p_fixture_id, p_team_score, p_opponent_score, p_match_notes, auth.uid())
  ON CONFLICT (fixture_id) DO UPDATE SET
    team_score     = EXCLUDED.team_score,
    opponent_score = EXCLUDED.opponent_score,
    match_notes    = EXCLUDED.match_notes,
    logged_by      = EXCLUDED.logged_by;

  UPDATE fixtures SET status = 'completed' WHERE id = p_fixture_id;

  IF jsonb_array_length(p_appearances) > 0 THEN
    INSERT INTO match_appearances (fixture_id, player_id, played)
    SELECT p_fixture_id, (a->>'player_id')::UUID, (a->>'played')::BOOLEAN
    FROM   jsonb_array_elements(p_appearances) AS a
    ON CONFLICT (fixture_id, player_id) DO UPDATE SET played = EXCLUDED.played;
  END IF;

  IF jsonb_array_length(p_ratings) > 0 THEN
    INSERT INTO player_ratings (fixture_id, player_id, coach_id, rating, note)
    SELECT p_fixture_id,
           (r->>'player_id')::UUID,
           auth.uid(),
           (r->>'rating')::INTEGER,
           r->>'note'
    FROM   jsonb_array_elements(p_ratings) AS r
    ON CONFLICT (fixture_id, player_id, coach_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      note   = EXCLUDED.note;
  END IF;

  RETURN json_build_object('success', TRUE);
END;
$$;

-- ─────────────────────────────────────────
-- SEED (uncomment for fresh pilot setup)
-- ─────────────────────────────────────────

-- INSERT INTO academies (id, name, location, province)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'GrowFit Football Academy', 'South Africa', 'Gauteng')
-- ON CONFLICT (id) DO NOTHING;
