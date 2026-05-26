-- ══════════════════════════════════════════════════════════════════
-- FootballPath — Migration 003
-- Allow a player to claim an unclaimed player record via share token
-- ══════════════════════════════════════════════════════════════════

-- Players with role='player' can update a row where profile_id IS NULL,
-- but only to set profile_id to their own auth.uid().
-- USING  → filters which rows the UPDATE is allowed to target (must be unclaimed)
-- WITH CHECK → validates the new row state (profile_id must equal caller's UID)
CREATE POLICY "player_self_claim" ON players
  FOR UPDATE
  USING  (profile_id IS NULL)
  WITH CHECK (profile_id = auth.uid() AND auth_role() = 'player');
