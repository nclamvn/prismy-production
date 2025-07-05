# 🚨 Troubleshooting Supabase 400 Error

## Error Analysis

You're seeing:
```
ziyereoasqiqhjvedgit.supabase.co/auth/v1/token?grant_type=password:1
Failed to load resource: the server responded with a status of 400 ()
```

This is a **400 Bad Request** error, which indicates:
- The request format is invalid 
- Authentication credentials are wrong
- Supabase configuration issue

## Immediate Diagnosis Steps

### Step 1: Run Supabase Diagnostics
1. Deploy the new diagnostic tools:
   ```bash
   git add -A && git commit -m "Add Supabase diagnostics" && git push origin fix/ssr-hydration
   ```

2. Visit `https://prismy.in/login` or run locally with `npm run dev`

3. Look for the **"Supabase Diagnostics"** button (bottom-left, below Debug Info)

4. Click **"Run Diagnostics"** - this will test:
   - ✅ Environment variables configuration
   - ✅ Supabase client creation
   - ✅ Basic connection test
   - ✅ Auth endpoint functionality

### Step 2: Check Environment Variables

The error suggests your Supabase URL or API key might be incorrect. Verify in your deployment:

#### Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set correctly:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ziyereoasqiqhjvedgit.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
   ```

#### Local Development (.env.local)
```bash
# Check your local environment file
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://ziyereoasqiqhjvedgit.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 3: Verify Supabase Project Status

1. **Login to Supabase Dashboard**: https://supabase.com/dashboard
2. **Check Project Status**: Ensure your project isn't paused or suspended
3. **Verify URL**: Project settings should show the same URL as your env vars

## Common Causes of 400 Errors

| Cause | Symptoms | Solution |
|-------|----------|----------|
| **Wrong Supabase URL** | 400 on all auth requests | Double-check project URL in dashboard |
| **Invalid API Key** | 400 on all requests | Regenerate anon key in project settings |
| **Project Paused** | 400/403 responses | Unpause project in dashboard |
| **Malformed Request** | 400 on specific endpoints | Check client configuration |
| **CORS Issues** | 400 with network errors | Verify domain in Supabase Auth settings |

## Quick Fixes

### Fix 1: Regenerate API Keys
1. Supabase Dashboard → Settings → API
2. Copy the new `anon` `public` key
3. Update environment variables in Vercel and local `.env.local`

### Fix 2: Verify Project URL
```bash
# Your current URL from the error:
https://ziyereoasqiqhjvedgit.supabase.co

# Should match exactly in:
# - Supabase Dashboard → Settings → General → Reference ID
# - Your environment variables
```

### Fix 3: Check Project Status
1. Dashboard → Project Overview
2. Look for any warnings or paused status
3. If paused, click "Resume" or upgrade plan

### Fix 4: Reset Client Configuration
If diagnostics show client creation issues, the Supabase configuration might be corrupted. Try:

```typescript
// Test direct client creation
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ziyereoasqiqhjvedgit.supabase.co',
  'your-anon-key-here'
)

// Test basic connection
const { data, error } = await supabase.auth.getUser()
console.log('Direct test:', { data, error })
```

## Expected Diagnostic Results

### ✅ Healthy Configuration
```
✓ Environment Variables: Set correctly
✓ Client Creation: Success  
✓ Connection Test: Connected to Supabase auth
✓ Signup Test: Endpoint working (rejected test email)
```

### ❌ 400 Error Configuration
```
✓ Environment Variables: Set correctly
✗ Client Creation: Success
✗ Connection Test: 400 Bad Request
✗ Signup Test: Network error
```

## Advanced Debugging

### Network Tab Analysis
1. Open DevTools → Network
2. Try any auth operation
3. Look for the failing request
4. Check:
   - **Request URL**: Should match your Supabase URL
   - **Request Headers**: Should include Authorization
   - **Response**: 400 error details

### Console Debugging
Add this to your auth form for detailed logging:
```javascript
console.log('Supabase Config:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
})
```

## Emergency Recovery

If all else fails:

### Option 1: Create New Supabase Project
1. Create fresh project in Supabase Dashboard  
2. Update environment variables with new URL/keys
3. Reconfigure auth settings

### Option 2: Switch to Different Auth Provider
Temporarily implement email/password auth with a different service while debugging Supabase.

---

**Next Steps**: Run the diagnostics tool and check the specific test results to pinpoint the exact configuration issue.