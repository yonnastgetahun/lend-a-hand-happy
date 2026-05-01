-- LENDLEE-016: Atomic lend_item() RPC
--
-- Adds the denormalized lender/borrower columns that the core lend flow
-- needs (we capture borrower name + phone inline on the loan row without
-- forcing a contact record to exist first), relaxes the old contact_id
-- NOT NULL constraint, updates RLS to key off lender_id, and introduces
-- the `lend_item` function that inserts an item + a loan in one atomic
-- transaction.

-- ============================================
-- Schema: add lender/borrower/tone columns to loans
-- ============================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS lender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS borrower_name TEXT,
  ADD COLUMN IF NOT EXISTS borrower_phone TEXT,
  ADD COLUMN IF NOT EXISTS tone TEXT;

-- The legacy flow required a contacts row before lending; the new flow
-- lets a lender just type a name + phone. contact_id is now optional.
ALTER TABLE loans ALTER COLUMN contact_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loans_lender_id ON loans(lender_id);

-- ============================================
-- RLS: switch loan policies to lender_id
-- ============================================
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Users can create loans" ON loans;
DROP POLICY IF EXISTS "Users can update own loans" ON loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON loans;

CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (auth.uid() = lender_id);

CREATE POLICY "Users can create loans" ON loans
  FOR INSERT WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Users can update own loans" ON loans
  FOR UPDATE USING (auth.uid() = lender_id);

CREATE POLICY "Users can delete own loans" ON loans
  FOR DELETE USING (auth.uid() = lender_id);

-- ============================================
-- Function: lend_item
--
-- Runs as SECURITY INVOKER so RLS applies to the calling user. Postgres
-- functions are transactional by default — any error (e.g. a NULL title
-- hitting the NOT NULL constraint on items.title) aborts the whole call
-- and neither row is persisted. We deliberately do NOT wrap the body in
-- EXCEPTION WHEN OTHERS; we want the error to propagate up and trigger
-- the rollback.
-- ============================================
CREATE OR REPLACE FUNCTION lend_item(
  p_title         text,
  p_category      text,
  p_borrower_name text,
  p_borrower_phone text,
  p_return_by     timestamptz,
  p_tone          text
)
RETURNS loans
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_loan    loans;
BEGIN
  INSERT INTO items (owner_id, title, category)
  VALUES (auth.uid(), p_title, COALESCE(p_category, 'other')::item_category)
  RETURNING id INTO v_item_id;

  INSERT INTO loans (
    item_id,
    lender_id,
    borrower_name,
    borrower_phone,
    return_by,
    tone,
    status
  )
  VALUES (
    v_item_id,
    auth.uid(),
    p_borrower_name,
    p_borrower_phone,
    p_return_by,
    p_tone,
    'active'
  )
  RETURNING * INTO v_loan;

  RETURN v_loan;
END;
$$;

-- Expose to authenticated users only; anon role should never call this.
REVOKE ALL ON FUNCTION lend_item(text, text, text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lend_item(text, text, text, text, timestamptz, text) TO authenticated;
