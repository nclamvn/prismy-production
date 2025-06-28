# Fix for Document Processing API 500 Error

## Root Causes Identified

1. **Missing Storage Bucket**: The API tries to upload files to a `processed-documents` bucket that doesn't exist in Supabase Storage
2. **Missing Database Tables**: The `tasks` and `credits` tables are required but may not be created
3. **Missing RPC Function**: The `get_user_credit_balance` function needs to be created
4. **Potential PDF parsing issues**: Dynamic import of `pdf-parse` might fail in some environments

## Step-by-Step Fix

### 1. Create Required Database Tables and Functions

Run the complete setup script in your Supabase SQL Editor:

```sql
-- Run the complete setup script
-- File: supabase-setup-complete.sql
```

This will create:

- `users` table
- `tasks` table
- `credits` table
- `invitations` table
- `get_user_credit_balance` function
- All necessary RLS policies

### 2. Create Storage Bucket

Run this in your Supabase SQL Editor:

```sql
-- File: setup-storage-bucket.sql (already created)
```

### 3. Fix Code Issues

The code has been updated to:

- Better handle storage bucket errors
- Add validation for PDF parsing library
- Improve error messages

### 4. Environment Variables

Ensure these are set in your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing the Fix

1. First, check if the database is properly set up:

   ```bash
   # Check if tables exist in Supabase dashboard
   # Go to Table Editor and verify: users, tasks, credits, invitations
   ```

2. Check if storage bucket exists:

   ```bash
   # Go to Storage in Supabase dashboard
   # Verify 'processed-documents' bucket exists
   ```

3. Test the API endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/documents/process \
     -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
     -F "file=@test.pdf" \
     -F "targetLang=es" \
     -F "serviceType=google_translate"
   ```

## Additional Debugging

If you still get 500 errors:

1. Check the server logs for specific error messages
2. Verify the user has sufficient credits (check `credits` table)
3. Ensure the translation API endpoint (`/api/translate/authenticated`) is working
4. Check if the PDF file is valid and not corrupted

## Quick Database Reset (if needed)

If you need to start fresh:

```sql
-- Drop existing tables (BE CAREFUL - this deletes all data)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS credits CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then run supabase-setup-complete.sql again
```

## Monitoring

Add logging to track issues:

- Check Supabase logs for database errors
- Check Vercel/Next.js logs for application errors
- Monitor the `tasks` table to see if tasks are being created

## Expected Flow

1. User uploads PDF/DOCX file
2. File is validated and buffer created
3. Text is extracted using pdf-parse or mammoth
4. User credits are checked via `get_user_credit_balance`
5. Task record is created in `tasks` table
6. Translation API is called
7. Original and translated files are uploaded to storage
8. Task status is updated to 'done'
9. Credits are deducted from user account

Each step has error handling that should now provide clear error messages instead of generic 500 errors.
