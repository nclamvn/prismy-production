-- Script để tạo tài khoản admin cho Prismy
-- Chạy script này trong Supabase SQL Editor

-- 1. Tìm user_id của bạn
-- Thay email@example.com bằng email của bạn
SELECT id, email FROM auth.users WHERE email = 'email@example.com';

-- 2. Copy user_id từ kết quả trên và thay vào dòng dưới
-- Ví dụ: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
UPDATE user_profiles 
SET subscription_tier = 'enterprise'
WHERE user_id = 'PASTE_YOUR_USER_ID_HERE';

-- 3. Kiểm tra kết quả
SELECT * FROM user_profiles WHERE user_id = 'PASTE_YOUR_USER_ID_HERE';

-- 4. Tạo credits ban đầu cho admin (optional)
INSERT INTO user_credits (
  user_id,
  credits_left,
  total_earned,
  purchased_credits
) VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  10000, -- 10,000 credits cho admin
  10000,
  10000
) ON CONFLICT (user_id) DO UPDATE SET
  credits_left = EXCLUDED.credits_left,
  total_earned = EXCLUDED.total_earned,
  purchased_credits = EXCLUDED.purchased_credits;