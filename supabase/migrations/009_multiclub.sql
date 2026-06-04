-- Add a human-readable join code to academies so new members can enter it during registration
ALTER TABLE academies ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE DEFAULT upper(substr(encode(gen_random_bytes(3),'hex'),1,6));

-- Ensure the pilot academy exists with a stable join code
INSERT INTO academies (id, name, join_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Growfit FA', 'PILOT1')
ON CONFLICT (id) DO UPDATE SET
  name     = COALESCE(academies.name,     'Growfit FA'),
  join_code = COALESCE(academies.join_code, 'PILOT1');

-- Allow any authenticated user to read academy rows (needed so new users can look up an academy by join_code)
DROP POLICY IF EXISTS "academy_lookup_by_code" ON academies;
CREATE POLICY "academy_lookup_by_code" ON academies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- SECURITY DEFINER: lets unauthenticated callers (e.g. sign-up flow) find an academy by code
CREATE OR REPLACE FUNCTION find_academy_by_join_code(p_code TEXT)
RETURNS JSON LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_rec academies%ROWTYPE;
BEGIN
  SELECT * INTO v_rec FROM academies WHERE join_code = upper(trim(p_code)) LIMIT 1;
  IF v_rec.id IS NULL THEN
    RETURN json_build_object('error', 'Club code not found.');
  END IF;
  RETURN json_build_object('academy_id', v_rec.id, 'name', v_rec.name, 'join_code', v_rec.join_code);
END;
$$;

-- SECURITY DEFINER: new club admin calls this after signing up, creates their academy + promotes them to admin
CREATE OR REPLACE FUNCTION register_academy(p_name TEXT, p_province TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_academy_id UUID;
  v_join_code  TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO academies (name, province)
  VALUES (p_name, p_province)
  RETURNING id, join_code INTO v_academy_id, v_join_code;
  UPDATE profiles SET academy_id = v_academy_id, role = 'admin' WHERE id = auth.uid();
  RETURN json_build_object('academy_id', v_academy_id, 'join_code', v_join_code, 'name', p_name);
END;
$$;

-- Admin can reset their academy join code
CREATE OR REPLACE FUNCTION reset_academy_join_code()
RETURNS TEXT LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_new_code   TEXT;
  v_academy_id UUID;
BEGIN
  SELECT academy_id INTO v_academy_id FROM profiles WHERE id = auth.uid() AND role = 'admin';
  IF v_academy_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  v_new_code := upper(substr(encode(gen_random_bytes(3),'hex'),1,6));
  UPDATE academies SET join_code = v_new_code WHERE id = v_academy_id;
  RETURN v_new_code;
END;
$$;
