CREATE TABLE IF NOT EXISTS training_attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('attending', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, player_id)
);

ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_manage_own_attendance" ON training_attendance;
CREATE POLICY "players_manage_own_attendance" ON training_attendance
  FOR ALL TO authenticated
  USING  (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()))
  WITH CHECK (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "coaches_read_session_attendance" ON training_attendance;
CREATE POLICY "coaches_read_session_attendance" ON training_attendance
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM training_sessions WHERE coach_id = auth.uid()
  ));
