-- Track which users have read / dismissed each announcement.
CREATE TABLE IF NOT EXISTS announcement_reads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id  UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ,
  dismissed_at     TIMESTAMPTZ,
  UNIQUE (user_id, announcement_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_reads" ON announcement_reads;
CREATE POLICY "users_manage_own_reads" ON announcement_reads
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
