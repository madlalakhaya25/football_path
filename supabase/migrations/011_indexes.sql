-- Performance indexes for high-traffic query patterns

CREATE INDEX IF NOT EXISTS idx_players_academy_id          ON players(academy_id);
CREATE INDEX IF NOT EXISTS idx_players_profile_id          ON players(profile_id);

CREATE INDEX IF NOT EXISTS idx_player_documents_player_season ON player_documents(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_documents_player_id  ON player_documents(player_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id        ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player_id      ON team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_active    ON team_members(team_id, active);

CREATE INDEX IF NOT EXISTS idx_fixtures_team_status        ON fixtures(team_id, status);
CREATE INDEX IF NOT EXISTS idx_fixtures_team_date          ON fixtures(team_id, fixture_date);

CREATE INDEX IF NOT EXISTS idx_player_ratings_player_id    ON player_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_player_attributes_player_id ON player_attributes(player_id);

CREATE INDEX IF NOT EXISTS idx_training_sessions_team_id   ON training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_id  ON training_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_drills_session_id  ON training_drills(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_session ON training_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_player  ON training_attendance(player_id);

CREATE INDEX IF NOT EXISTS idx_media_uploads_session_id    ON media_uploads(session_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_fixture_id    ON media_uploads(fixture_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_player_id        ON media_tags(player_id);

CREATE INDEX IF NOT EXISTS idx_profiles_academy_id         ON profiles(academy_id);
CREATE INDEX IF NOT EXISTS idx_parent_player_links_parent  ON parent_player_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_player_links_player  ON parent_player_links(player_id);
