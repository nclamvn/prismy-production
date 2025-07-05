# 🚨 Troubleshooting Supabase 422 Authentication Error

## Quick Diagnosis Steps

### Step 1: Check Console Logs
1. Open browser DevTools (F12) → Console tab
2. Navigate to signup page (`/login` and switch to signup mode)
3. Try to sign up with a test email
4. Look for these debug messages:
   ```
   🔧 DEBUG: Signup attempt: { email, passwordLength, redirectUrl, origin }
   🚨 Supabase signup error: { message, status, code, details }
   ```

### Step 2: Network Tab Analysis
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Attempt signup
4. Look for the POST request to `supabase.co/auth/v1/signup`
5. Check the Response tab for exact error details

### Step 3: Supabase Dashboard Check
Go to your Supabase dashboard and verify:

#### 3.1 Auth Providers
- **Auth → Providers → Email**: Must be ✅ **Enabled**
- **Email OTP**: Enable if using magic links

#### 3.2 URL Configuration  
- **Auth → URL Configuration → Redirect URLs**
- Must include: `https://prismy.in/auth/callback`
- For development: `http://localhost:3000/auth/callback`

#### 3.3 Password Policy
- **Auth → Settings → Password policy**
- If "Require complex passwords" is enabled, temporarily disable for testing
- Minimum length should be ≤ 8 characters

#### 3.4 Email Domain Settings
- **Auth → Settings → Email Domain Restrictions**
- Check if your test email domain is blocked
- Gmail/common domains should work

## Common 422 Error Codes & Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `invalid_email` | Email format invalid | Use proper email format (test@example.com) |
| `invalid_redirect_url` | Callback URL not in allowlist | Add `https://prismy.in/auth/callback` to Redirect URLs |
| `password_too_short` | Password < minimum length | Use 8+ character password |
| `email_already_registered` | Duplicate signup attempt | Delete user from Auth → Users or try signing in |
| `signup_disabled` | Email provider disabled | Enable Email provider in Auth → Providers |
| `domain_blocked` | Email domain not allowed | Check Email Domain Restrictions |

## Test Credentials

Use these for testing:
- **Email**: `test.prismy.$(date +%s)@gmail.com` (unique each time)
- **Password**: `TestPassword123!` (meets all requirements)

## Production vs Development

### Development Testing
```bash
# Start local server
npm run dev

# Visit http://localhost:3000/login
# Check debug info widget in bottom-left
# Console logs will show detailed debugging
```

### Production Testing  
```bash
# Deploy changes
git push origin fix/ssr-hydration

# Visit https://prismy.in/login
# Debug info widget won't appear (production mode)
# Use Network tab for debugging
```

## Emergency Fixes

### Fix 1: Reset Password Policy
1. Supabase Dashboard → Auth → Settings → Password policy
2. Uncheck "Require complex passwords"
3. Set minimum length to 6
4. Test signup again

### Fix 2: Clear Users Table
1. Auth → Users
2. Delete any users with `email_confirmed = false`
3. This clears "duplicate email" errors

### Fix 3: Reset Redirect URLs
1. Auth → URL Configuration
2. Clear all redirect URLs
3. Add only: `https://prismy.in/auth/callback`
4. For development add: `http://localhost:3000/auth/callback`

### Fix 4: Check Rate Limiting
If you see "too many requests":
1. Wait 5-10 minutes
2. Try from different IP/browser
3. Clear browser cookies for the site

## Expected Flow

### Successful Signup
```
1. POST /auth/v1/signup → 200 OK
2. User receives email with confirmation link
3. Click email link → GET /auth/callback?code=xxx
4. Exchange code for session → Redirect to /app
```

### Debug Output (Console)
```javascript
🔧 DEBUG: Signup attempt: {
  email: "test@example.com",
  passwordLength: 12,
  redirectUrl: "https://prismy.in/auth/callback",
  origin: "https://prismy.in"
}

✅ Signup successful: {
  user: { id: "xxx", email: "test@example.com" },
  session: null // Will be created after email confirmation
}
```

## Contact Support

If all steps fail, provide this information:
1. Console error logs (🚨 messages)
2. Network tab screenshot showing 422 response
3. Email domain being used
4. Supabase project URL (first 20 characters)
5. Time of attempt (for log correlation)

---

**Last Updated**: After adding enhanced debugging and validation
**Test Status**: Ready for systematic debugging