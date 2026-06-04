-- Extend document_type to include POPIA consent and ID document upload
ALTER TABLE player_documents
  DROP CONSTRAINT IF EXISTS player_documents_document_type_check;
ALTER TABLE player_documents
  ADD CONSTRAINT player_documents_document_type_check
  CHECK (document_type IN (
    'registration_agreement',
    'consent_form',
    'code_of_ethics',
    'medical_consent',
    'popia_consent',
    'id_document'
  ));
