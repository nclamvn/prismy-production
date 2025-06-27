-- Update invitation code to PRISMY2025

-- Update existing code or create new one
INSERT INTO invitations (code, max_uses, credit_amount, metadata) 
VALUES (
  'PRISMY2025', 
  100, 
  15000,
  '{"description": "Welcome to Prismy 2025 - Beta Access", "type": "beta_welcome"}'
) ON CONFLICT (code) DO UPDATE SET
  max_uses = 100,
  credit_amount = 15000,
  is_active = TRUE,
  metadata = '{"description": "Welcome to Prismy 2025 - Beta Access", "type": "beta_welcome"}';

-- Optionally deactivate the old 2024 code
UPDATE invitations 
SET is_active = FALSE 
WHERE code = 'PRISMY2024';

-- Show updated invitation codes
SELECT 
  code,
  max_uses,
  current_uses,
  credit_amount,
  is_active,
  metadata->>'description' as description
FROM invitations 
ORDER BY created_at DESC;