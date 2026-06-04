-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DEVELOPMENT PATHWAYS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS development_milestone_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid REFERENCES academies(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  position    text,            -- null = applies to all positions
  age_group   text,            -- null = all age groups, e.g. 'U13', 'U15', 'Senior'
  category    text NOT NULL CHECK (category IN ('technical','tactical','physical','mental','leadership')),
  sort_order  int  DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE development_milestone_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_members_read_milestones" ON development_milestone_templates
  FOR SELECT TO authenticated
  USING (academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "coaches_admins_manage_milestones" ON development_milestone_templates
  FOR ALL TO authenticated
  USING (academy_id IN (
    SELECT academy_id FROM profiles WHERE id = auth.uid() AND role IN ('coach','admin')
  ))
  WITH CHECK (academy_id IN (
    SELECT academy_id FROM profiles WHERE id = auth.uid() AND role IN ('coach','admin')
  ));

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_milestone_completions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   uuid NOT NULL REFERENCES development_milestone_templates(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season        text NOT NULL,
  completed_by  uuid REFERENCES profiles(id),
  completed_at  timestamptz DEFAULT now(),
  note          text,
  UNIQUE (template_id, player_id, season)
);

ALTER TABLE player_milestone_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_members_read_completions" ON player_milestone_completions
  FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "coaches_admins_manage_completions" ON player_milestone_completions
  FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid() AND pr.role IN ('coach','admin')
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid() AND pr.role IN ('coach','admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_milestone_completions_player  ON player_milestone_completions(player_id, season);
CREATE INDEX IF NOT EXISTS idx_milestone_completions_template ON player_milestone_completions(template_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLAYER VIDEO CLIPS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_clips (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fixture_id        uuid REFERENCES fixtures(id) ON DELETE SET NULL,
  added_by          uuid REFERENCES profiles(id),
  title             text NOT NULL,
  url               text NOT NULL,
  timestamp_seconds int,
  description       text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE player_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_members_read_clips" ON player_clips
  FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "coaches_admins_manage_clips" ON player_clips
  FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid() AND pr.role IN ('coach','admin')
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT p.id FROM players p
      JOIN profiles pr ON pr.academy_id = p.academy_id
      WHERE pr.id = auth.uid() AND pr.role IN ('coach','admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_player_clips_player_id ON player_clips(player_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DRILL LIBRARY
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drill_library (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       uuid REFERENCES academies(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES profiles(id),
  name             text NOT NULL,
  description      text,
  category         text NOT NULL CHECK (category IN (
                     'warm_up','technical','tactical','physical','small_sided','cool_down'
                   )),
  duration_minutes int,
  difficulty       text CHECK (difficulty IN ('beginner','intermediate','advanced')),
  video_url        text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE drill_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_coaches_read_drill_library" ON drill_library
  FOR SELECT TO authenticated
  USING (academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "coaches_admins_manage_drill_library" ON drill_library
  FOR ALL TO authenticated
  USING (academy_id IN (
    SELECT academy_id FROM profiles WHERE id = auth.uid() AND role IN ('coach','admin')
  ))
  WITH CHECK (academy_id IN (
    SELECT academy_id FROM profiles WHERE id = auth.uid() AND role IN ('coach','admin')
  ));

CREATE INDEX IF NOT EXISTS idx_drill_library_academy ON drill_library(academy_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COACH ATTENDANCE MARKING (per training session, replaces RSVP-only)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE training_attendance
  ADD COLUMN IF NOT EXISTS marked_by  uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS marked_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS note       text;

-- Allow coaches to insert/update attendance for their sessions
DROP POLICY IF EXISTS "coaches_manage_session_attendance" ON training_attendance;
CREATE POLICY "coaches_manage_session_attendance" ON training_attendance
  FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions WHERE coach_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM training_sessions WHERE coach_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MATCH ATTENDANCE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_attendance (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id  uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_by  uuid REFERENCES profiles(id),
  marked_at  timestamptz DEFAULT now(),
  note       text,
  UNIQUE (fixture_id, player_id)
);

ALTER TABLE match_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_match_attendance" ON match_attendance
  FOR ALL TO authenticated
  USING (
    fixture_id IN (
      SELECT f.id FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE t.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    fixture_id IN (
      SELECT f.id FROM fixtures f
      JOIN teams t ON t.id = f.team_id
      WHERE t.coach_id = auth.uid()
    )
  );

CREATE POLICY "players_read_own_match_attendance" ON match_attendance
  FOR SELECT TO authenticated
  USING (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()));

CREATE POLICY "parents_read_child_match_attendance" ON match_attendance
  FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_match_attendance_fixture  ON match_attendance(fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_attendance_player   ON match_attendance(player_id);
