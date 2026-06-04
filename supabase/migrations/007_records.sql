-- Extend players table with registration fields
ALTER TABLE players ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS mysafa_number TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS id_doc_url TEXT;

-- Medical & emergency info (one record per player)
CREATE TABLE IF NOT EXISTS player_medical (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id               UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  blood_type              TEXT,
  allergies               TEXT DEFAULT 'NONE',
  chronic_conditions      TEXT DEFAULT 'NONE',
  current_medication      TEXT DEFAULT 'NONE',
  condition_notes         TEXT,
  physical_restrictions   TEXT,
  emergency_1_name        TEXT,
  emergency_1_relationship TEXT,
  emergency_1_phone       TEXT,
  emergency_2_name        TEXT,
  emergency_2_relationship TEXT,
  emergency_2_phone       TEXT,
  has_medical_aid         BOOLEAN DEFAULT FALSE,
  medical_aid_scheme      TEXT,
  medical_aid_number      TEXT,
  medical_aid_principal   TEXT,
  doctor_clinic           TEXT,
  nearest_hospital        TEXT,
  treatment_authorised    BOOLEAN DEFAULT FALSE,
  authorised_by           TEXT,
  authorised_at           TIMESTAMPTZ,
  season                  TEXT,
  needs_renewal           BOOLEAN DEFAULT FALSE,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_medical ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_medical" ON player_medical;
CREATE POLICY "admin_manage_medical" ON player_medical FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "parents_manage_child_medical" ON player_medical;
CREATE POLICY "parents_manage_child_medical" ON player_medical FOR ALL TO authenticated
  USING  (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()))
  WITH CHECK (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "coaches_read_medical" ON player_medical;
CREATE POLICY "coaches_read_medical" ON player_medical FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT tm.player_id FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.coach_id = auth.uid() AND tm.active = true
  ));

-- Consents per player per season
CREATE TABLE IF NOT EXISTS player_consents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id               UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season                  TEXT NOT NULL,
  participation_consent   BOOLEAN DEFAULT FALSE,
  photo_consent           BOOLEAN DEFAULT FALSE,
  transport_consent       BOOLEAN DEFAULT FALSE,
  risk_acknowledged       BOOLEAN DEFAULT FALSE,
  signed_by               TEXT,
  signed_at               TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_id, season)
);

ALTER TABLE player_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_consents" ON player_consents;
CREATE POLICY "admin_manage_consents" ON player_consents FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "parents_manage_child_consents" ON player_consents;
CREATE POLICY "parents_manage_child_consents" ON player_consents FOR ALL TO authenticated
  USING  (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()))
  WITH CHECK (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "coaches_read_consents" ON player_consents;
CREATE POLICY "coaches_read_consents" ON player_consents FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT tm.player_id FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.coach_id = auth.uid() AND tm.active = true
  ));

-- Documents & contracts (signed digitally OR uploaded scan)
-- NOTE: the 'player-documents' Supabase Storage bucket must be created
-- manually via the Supabase dashboard before uploads will work.
CREATE TABLE IF NOT EXISTS player_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'registration_agreement', 'consent_form', 'code_of_ethics', 'medical_consent'
                   )),
  season           TEXT NOT NULL,
  signed_digitally BOOLEAN DEFAULT FALSE,
  signer_name      TEXT,
  signer_role      TEXT,
  signed_at        TIMESTAMPTZ,
  upload_url       TEXT,
  file_name        TEXT,
  uploaded_at      TIMESTAMPTZ,
  uploaded_by      UUID REFERENCES auth.users(id),
  status           TEXT NOT NULL DEFAULT 'unsigned'
                     CHECK (status IN ('unsigned','signed','uploaded','needs_renewal')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_id, document_type, season)
);

ALTER TABLE player_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_documents" ON player_documents;
CREATE POLICY "admin_manage_documents" ON player_documents FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "parents_manage_child_documents" ON player_documents;
CREATE POLICY "parents_manage_child_documents" ON player_documents FOR ALL TO authenticated
  USING  (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()))
  WITH CHECK (player_id IN (SELECT player_id FROM parent_player_links WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "coaches_read_documents" ON player_documents;
CREATE POLICY "coaches_read_documents" ON player_documents FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT tm.player_id FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.coach_id = auth.uid() AND tm.active = true
  ));
