-- Update handle_new_user trigger to read role from signup metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, academy_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    '00000000-0000-0000-0000-000000000001'::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Increase announcements body limit from 500 to 2000 characters
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_body_check;
ALTER TABLE announcements ADD CONSTRAINT announcements_body_check CHECK (char_length(body) <= 2000);
