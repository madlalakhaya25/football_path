-- Phase 2: Training module + Phase 3 schema additions

-- ─── Phase 3 schema additions ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coaching_role TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE parent_player_links
  ADD COLUMN IF NOT EXISTS relationship TEXT DEFAULT 'parent';

-- ─── training_sessions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  session_date TIMESTAMPTZ NOT NULL,
  location     TEXT,
  session_type TEXT NOT NULL DEFAULT 'general'
    CHECK (session_type IN ('general','technical','tactical','fitness','match_prep','recovery')),
  notes        TEXT CHECK (char_length(notes) <= 1000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_sessions_coach_all" ON training_sessions
  FOR ALL TO authenticated
  USING  (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "training_sessions_player_read" ON training_sessions
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE p.profile_id = auth.uid() AND tm.active = true
    )
  );

-- ─── training_drills ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_drills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description  TEXT CHECK (char_length(description) <= 500),
  video_url    TEXT,
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_drills ENABLE ROW LEVEL SECURITY;

-- Drills inherit access from their parent session
CREATE POLICY "training_drills_coach_all" ON training_drills
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

CREATE POLICY "training_drills_player_read" ON training_drills
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT ts.id FROM training_sessions ts
      JOIN team_members tm ON tm.team_id = ts.team_id
      JOIN players p ON p.id = tm.player_id
      WHERE p.profile_id = auth.uid() AND tm.active = true
    )
  );
