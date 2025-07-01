-- Script để tạo 10 invite codes cho beta testers
-- Chạy trong Supabase SQL Editor

-- Set invite salt (chỉ cần chạy 1 lần)
SET app.invite_salt = 'prismy-invite-salt-2025-secure-key-do-not-share';

-- Tạo function helper để generate và insert invites
CREATE OR REPLACE FUNCTION create_beta_invites(
  num_invites INTEGER DEFAULT 10,
  credits_per_invite INTEGER DEFAULT 500,
  admin_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  invite_code TEXT,
  credits INTEGER,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  i INTEGER;
  new_code TEXT;
  code_hash TEXT;
  code_preview TEXT;
BEGIN
  FOR i IN 1..num_invites LOOP
    -- Generate unique code
    new_code := generate_invite_code();
    code_hash := hash_invite_code(new_code);
    code_preview := substring(new_code, 1, 4) || '...';
    
    -- Insert invite
    INSERT INTO invites (
      code_hash,
      code_preview,
      credits_initial,
      created_by,
      metadata,
      expires_at
    ) VALUES (
      code_hash,
      code_preview,
      credits_per_invite,
      admin_user_id,
      jsonb_build_object(
        'purpose', 'beta_testing',
        'batch', 'initial_10_testers',
        'created_date', NOW()
      ),
      NOW() + INTERVAL '30 days'
    );
    
    -- Return the actual code (chỉ lần này thôi!)
    RETURN QUERY SELECT 
      new_code as invite_code,
      credits_per_invite as credits,
      NOW() + INTERVAL '30 days' as expires_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Tạo 10 invite codes
-- QUAN TRỌNG: Copy và lưu các mã này ngay! Chỉ hiển thị 1 lần
SELECT * FROM create_beta_invites(
  10,     -- số lượng invites
  500,    -- credits mỗi invite
  NULL    -- admin_user_id (để NULL nếu chưa có)
);

-- Xem danh sách invites đã tạo (không hiển thị code gốc)
SELECT 
  code_preview,
  credits_initial,
  is_used,
  expires_at,
  created_at
FROM invites
ORDER BY created_at DESC
LIMIT 10;