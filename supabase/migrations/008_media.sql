-- Media uploads (photos/videos per training session or fixture)
CREATE TABLE IF NOT EXISTS media_uploads (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id   UUID        NOT NULL REFERENCES academies(id)          ON DELETE CASCADE,
  team_id      UUID        REFERENCES teams(id)                        ON DELETE SET NULL,
  session_id   UUID        REFERENCES training_sessions(id)            ON DELETE SET NULL,
  fixture_id   UUID        REFERENCES fixtures(id)                     ON DELETE SET NULL,
  uploaded_by  UUID        NOT NULL REFERENCES profiles(id)            ON DELETE CASCADE,
  url          TEXT        NOT NULL,
  media_type   TEXT        NOT NULL CHECK (media_type IN ('photo','video')),
  caption      TEXT        CHECK (char_length(caption) <= 200),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_tags (
  media_id   UUID NOT NULL REFERENCES media_uploads(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES players(id)       ON DELETE CASCADE,
  PRIMARY KEY (media_id, player_id)
);

ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags    ENABLE ROW LEVEL SECURITY;

-- media_uploads RLS
DROP POLICY IF EXISTS "media_academy_read"    ON media_uploads;
DROP POLICY IF EXISTS "media_staff_insert"    ON media_uploads;
DROP POLICY IF EXISTS "media_uploader_delete" ON media_uploads;
CREATE POLICY "media_academy_read" ON media_uploads
  FOR SELECT USING (academy_id = auth_academy_id());
CREATE POLICY "media_staff_insert" ON media_uploads
  FOR INSERT WITH CHECK (academy_id = auth_academy_id() AND is_admin_or_coach());
CREATE POLICY "media_uploader_delete" ON media_uploads
  FOR DELETE USING (uploaded_by = auth.uid());

-- media_tags RLS
DROP POLICY IF EXISTS "media_tags_read"        ON media_tags;
DROP POLICY IF EXISTS "media_tags_staff_write" ON media_tags;
DROP POLICY IF EXISTS "media_tags_staff_delete" ON media_tags;
CREATE POLICY "media_tags_read" ON media_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM media_uploads m WHERE m.id = media_tags.media_id AND m.academy_id = auth_academy_id())
  );
CREATE POLICY "media_tags_staff_write" ON media_tags
  FOR INSERT WITH CHECK (
    is_admin_or_coach() AND
    EXISTS (SELECT 1 FROM media_uploads m WHERE m.id = media_tags.media_id AND m.academy_id = auth_academy_id())
  );
CREATE POLICY "media_tags_staff_delete" ON media_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM media_uploads m WHERE m.id = media_tags.media_id AND m.uploaded_by = auth.uid())
  );
