-- Security fixes identified by Tyson security audit (2026-05-02)
--
-- H-2: get_user_stats uses SECURITY DEFINER without search_path and accepts
--       arbitrary user_id — any authenticated user can query another's stats.
-- H-3: handle_new_user and handle_user_update use SECURITY DEFINER without
--       search_path, vulnerable to search-path hijacking.

-- ============================================
-- H-2: Fix get_user_stats — use auth.uid() instead of parameter
-- ============================================
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  available_items BIGINT,
  lent_items BIGINT,
  given_items BIGINT,
  active_loans BIGINT,
  total_contacts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- Only allow querying your own stats
  IF user_id <> v_uid THEN
    RAISE EXCEPTION 'unauthorized: cannot query another user''s stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM items WHERE owner_id = v_uid)::BIGINT as total_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = v_uid AND status = 'available')::BIGINT as available_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = v_uid AND status = 'lent')::BIGINT as lent_items,
    (SELECT COUNT(*) FROM items WHERE owner_id = v_uid AND status = 'given')::BIGINT as given_items,
    (SELECT COUNT(*) FROM loans l
     JOIN items i ON l.item_id = i.id
     WHERE i.owner_id = v_uid AND l.status = 'active')::BIGINT as active_loans,
    (SELECT COUNT(*) FROM contacts WHERE owner_id = v_uid)::BIGINT as total_contacts;
END;
$$;

-- ============================================
-- H-3: Fix handle_new_user — add search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- H-3: Fix handle_user_update — add search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
