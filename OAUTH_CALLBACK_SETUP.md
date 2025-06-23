# 🔐 OAuth Callback Setup Guide

## 🚨 IMPORTANT: Supabase Configuration Required

After deploying this update, you MUST configure the following URLs in your Supabase dashboard:

### 1. **Supabase Dashboard Configuration**

Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → Authentication → URL Configuration

Add these URLs to **Redirect URLs** (allowed list):

```
https://prismy.in/auth/callback
https://www.prismy.in/auth/callback
http://localhost:3001/auth/callback
https://prismy-production-*.vercel.app/auth/callback
```

### 2. **Google OAuth Configuration**

In [Google Cloud Console](https://console.cloud.google.com):

1. APIs & Services → Credentials → OAuth 2.0 Client
2. Add to **Authorized redirect URIs**:

```
https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback
```

(Keep existing URIs, don't remove them)

### 3. **Apple OAuth Configuration**

Similar setup for Apple Sign In if enabled.

## 🔍 How the New Flow Works

**Before (Problematic)**:

```
User → Google Auth → Redirect to /workspace → No session → Loading forever
```

**After (Fixed)**:

```
User → Google Auth → /auth/callback → Exchange code → Redirect to /workspace with session
```

## 🧪 Testing the Fix

1. **Clear browser cookies/cache** for prismy.in
2. Go to https://prismy.in
3. Click "Get Started" (hero button)
4. Click "Continue with Google"
5. Should authenticate and redirect to workspace properly

## ⚠️ Troubleshooting

If you see errors after deployment:

1. **"Redirect URL not allowed"** → Add URLs to Supabase dashboard
2. **"Auth callback failed"** → Check Supabase logs
3. **Still loading forever** → Clear cookies and try again

## 📝 Notes

- The callback URL includes the intended redirect as a query param
- Example: `/auth/callback?redirectTo=/workspace`
- This ensures users go to the right place after auth
