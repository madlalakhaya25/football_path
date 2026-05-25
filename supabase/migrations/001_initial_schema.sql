-- ══════════════════════════════════════════════════════════════════
-- FootballPath — GrowFit Pilot Schema
-- Migration: 001_initial_schema.sql
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- ACADEMY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  location     TEXT,
  province     TEXT,
  logo_url     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROFILES (all authenticated users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id   UUID REFERENCES academies(id) ON DELETE SET NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player', 'parent')),
  full_name    TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a minimal profile row on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- role defaults to 'player'; the client updates it during onboarding
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
-- PLAYERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  date_of_birth   DATE,
  position        TEXT CHECK (position IN ('goalkeeper','defender','midfielder','winger','striker')),
  secondary_pos   TEXT CHECK (secondary_pos IN ('goalkeeper','defender','midfielder','winger','striker')),
  preferred_foot  TEXT CHECK (preferred_foot IN ('left','right','both')),
  photo_url       TEXT,
  share_token     TEXT UNIQUE NOT NULL DEFAULT substr(encode(gen_random_bytes(6), 'hex'), 1, 10),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id   UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age_group    TEXT,
  coach_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code  TEXT UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 6)),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (team_id, player_id)
);

-- ─────────────────────────────────────────
-- PARENT ↔ PLAYER
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_player_links (
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_id, player_id)
);

-- ─────────────────────────────────────────
-- FIXTURES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixtures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent       TEXT NOT NULL,
  venue          TEXT,
  fixture_date   TIMESTAMPTZ NOT NULL,
  is_home        BOOLEAN NOT NULL DEFAULT TRUE,
  status         TEXT NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming','completed','cancelled','postponed')),
  notes          TEXT,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MATCH RESULTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id      UUID NOT NULL UNIQUE REFERENCES fixtures(id) ON DELETE CASCADE,
  team_score      SMALLINT NOT NULL DEFAULT 0 CHECK (team_score >= 0),
  opponent_score  SMALLINT NOT NULL DEFAULT 0 CHECK (opponent_score >= 0),
  match_notes     TEXT,
  logged_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MATCH APPEARANCES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_appearances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id  UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  played      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (fixture_id, player_id)
);

-- ─────────────────────────────────────────
-- PLAYER RATINGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id   UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note         TEXT CHECK (char_length(note) <= 200),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fixture_id, player_id, coach_id)
);

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE academies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures           ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_appearances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS for RLS
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_academy_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_or_coach()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role IN ('admin', 'coach') FROM profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────
-- ACADEMIES
-- ─────────────────────────────────────────
CREATE POLICY "academy_read_own" ON academies
  FOR SELECT USING (id = auth_academy_id());

CREATE POLICY "academy_admin_all" ON academies
  FOR ALL USING (id = auth_academy_id() AND auth_role() = 'admin');

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
CREATE POLICY "profile_read_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin can read all profiles in their academy
CREATE POLICY "profile_admin_read" ON profiles
  FOR SELECT USING (
    academy_id = auth_academy_id() AND auth_role() = 'admin'
  );

-- Coach can read profiles in their academy (for squad management)
CREATE POLICY "profile_coach_read" ON profiles
  FOR SELECT USING (
    academy_id = auth_academy_id() AND auth_role() = 'coach'
  );

-- ─────────────────────────────────────────
-- PLAYERS
-- ─────────────────────────────────────────

-- Players in the same academy are readable by admin/coach
CREATE POLICY "player_academy_read" ON players
  FOR SELECT USING (academy_id = auth_academy_id());

-- Admin and coach can insert/update players
CREATE POLICY "player_staff_write" ON players
  FOR INSERT WITH CHECK (
    academy_id = auth_academy_id() AND is_admin_or_coach()
  );

CREATE POLICY "player_staff_update" ON players
  FOR UPDATE USING (
    academy_id = auth_academy_id() AND is_admin_or_coach()
  );

-- Player can read their own record (matched via profile_id)
CREATE POLICY "player_self_read" ON players
  FOR SELECT USING (profile_id = auth.uid());

-- Parent can read their linked children
CREATE POLICY "player_parent_read" ON players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_player_links
      WHERE parent_id = auth.uid() AND player_id = players.id
    )
  );

-- Public passport reads via share_token are handled by a separate view/function

-- ─────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────
CREATE POLICY "team_read_academy" ON teams
  FOR SELECT USING (academy_id = auth_academy_id());

CREATE POLICY "team_staff_write" ON teams
  FOR INSERT WITH CHECK (academy_id = auth_academy_id() AND is_admin_or_coach());

CREATE POLICY "team_staff_update" ON teams
  FOR UPDATE USING (academy_id = auth_academy_id() AND is_admin_or_coach());

-- ─────────────────────────────────────────
-- TEAM MEMBERS
-- ─────────────────────────────────────────
CREATE POLICY "team_member_read" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "team_member_staff_write" ON team_members
  FOR INSERT WITH CHECK (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "team_member_staff_delete" ON team_members
  FOR DELETE USING (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

-- ─────────────────────────────────────────
-- PARENT PLAYER LINKS
-- ─────────────────────────────────────────
CREATE POLICY "parent_link_own" ON parent_player_links
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "parent_link_insert" ON parent_player_links
  FOR INSERT WITH CHECK (
    parent_id = auth.uid() AND auth_role() = 'parent'
  );

CREATE POLICY "parent_link_delete" ON parent_player_links
  FOR DELETE USING (parent_id = auth.uid());

-- Admin can also manage links
CREATE POLICY "parent_link_admin" ON parent_player_links
  FOR ALL USING (auth_role() = 'admin');

-- ─────────────────────────────────────────
-- FIXTURES
-- ─────────────────────────────────────────
CREATE POLICY "fixture_read_academy" ON fixtures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = fixtures.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "fixture_staff_write" ON fixtures
  FOR INSERT WITH CHECK (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = fixtures.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "fixture_staff_update" ON fixtures
  FOR UPDATE USING (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = fixtures.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

-- ─────────────────────────────────────────
-- MATCH RESULTS
-- ─────────────────────────────────────────
CREATE POLICY "result_read_academy" ON match_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = match_results.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "result_staff_write" ON match_results
  FOR INSERT WITH CHECK (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = match_results.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "result_staff_update" ON match_results
  FOR UPDATE USING (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = match_results.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

-- ─────────────────────────────────────────
-- MATCH APPEARANCES
-- ─────────────────────────────────────────
CREATE POLICY "appearance_read_academy" ON match_appearances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = match_appearances.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "appearance_staff_write" ON match_appearances
  FOR INSERT WITH CHECK (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = match_appearances.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

-- ─────────────────────────────────────────
-- PLAYER RATINGS
-- ─────────────────────────────────────────

-- Coach can only insert their own ratings
CREATE POLICY "rating_coach_insert" ON player_ratings
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND is_admin_or_coach()
  );

-- Coach can update their own ratings
CREATE POLICY "rating_coach_update" ON player_ratings
  FOR UPDATE USING (coach_id = auth.uid());

-- Player can read their own ratings
CREATE POLICY "rating_player_read" ON player_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_ratings.player_id
      AND p.profile_id = auth.uid()
    )
  );

-- Parent can read their child's ratings
CREATE POLICY "rating_parent_read" ON player_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_player_links ppl
      WHERE ppl.parent_id = auth.uid()
      AND ppl.player_id = player_ratings.player_id
    )
  );

-- Coach/admin in same academy can read all ratings
CREATE POLICY "rating_staff_read" ON player_ratings
  FOR SELECT USING (
    is_admin_or_coach() AND
    EXISTS (
      SELECT 1 FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE f.id = player_ratings.fixture_id
      AND t.academy_id = auth_academy_id()
    )
  );

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
CREATE POLICY "announcement_read_academy" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = announcements.team_id
      AND t.academy_id = auth_academy_id()
    )
  );

CREATE POLICY "announcement_coach_write" ON announcements
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND is_admin_or_coach()
  );

-- ══════════════════════════════════════════════════════════════════
-- PUBLIC PASSPORT VIEW (no auth required — uses share_token)
-- Used by the public web page, bypasses RLS via security definer
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_public_passport(p_share_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'share_token',       p.share_token,
    'full_name',         p.full_name,
    'position',          p.position,
    'preferred_foot',    p.preferred_foot,
    'photo_url',         p.photo_url,
    'age',               CASE
                           WHEN p.date_of_birth IS NOT NULL
                           THEN DATE_PART('year', AGE(p.date_of_birth))::INT
                           ELSE NULL
                         END,
    'team_name',         t.name,
    'academy_name',      a.name,
    'appearances_count', (
      SELECT COUNT(*) FROM match_appearances ma WHERE ma.player_id = p.id AND ma.played = TRUE
    ),
    'rating_average',    (
      SELECT ROUND(AVG(pr.rating)::NUMERIC, 1)
      FROM player_ratings pr
      WHERE pr.player_id = p.id
    ),
    'recent_ratings', (
      SELECT json_agg(r ORDER BY r.fixture_date DESC)
      FROM (
        SELECT
          pr.rating,
          pr.note,
          f.opponent AS fixture_opponent,
          f.fixture_date::DATE::TEXT AS fixture_date
        FROM player_ratings pr
        JOIN fixtures f ON f.id = pr.fixture_id
        WHERE pr.player_id = p.id
        ORDER BY f.fixture_date DESC
        LIMIT 5
      ) r
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

-- ══════════════════════════════════════════════════════════════════
-- SEED: GrowFit Academy (run once during pilot setup)
-- ══════════════════════════════════════════════════════════════════

-- INSERT INTO academies (id, name, location, province)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'GrowFit Football Academy', 'South Africa', 'Gauteng');
-- (Uncomment and run manually after migration)
