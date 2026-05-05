-- Account deletion RPC — required by Apple App Store guideline 5.1.1(v)
-- Deletes all user data (items, loans, gives, contacts, profile) then the auth user.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Delete loans (via items cascade, but be explicit)
  DELETE FROM loans WHERE lender_id = v_uid;
  -- Delete gives (via items cascade, but be explicit)
  DELETE FROM gives WHERE item_id IN (SELECT id FROM items WHERE owner_id = v_uid);
  -- Delete items
  DELETE FROM items WHERE owner_id = v_uid;
  -- Delete contacts
  DELETE FROM contacts WHERE owner_id = v_uid;
  -- Delete profile
  DELETE FROM profiles WHERE id = v_uid;
  -- Delete the auth user
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
