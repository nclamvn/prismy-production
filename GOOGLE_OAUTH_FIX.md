# 🔧 GOOGLE OAUTH CONSOLE FIX

## Problem
The Google OAuth Console has outdated callback URLs, causing 404 errors after authentication.

## Solution
Update Google OAuth Console with correct Supabase callback URL.

## Steps to Fix:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project (the one with OAuth credentials)

### 2. Navigate to OAuth Settings
- Go to: **APIs & Services** > **Credentials**
- Find your OAuth 2.0 Client ID (Web application)
- Click **Edit** (pencil icon)

### 3. Update Authorized Redirect URIs
Add or ensure these URIs are present:

```
https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback
```

**IMPORTANT**: This is the Supabase callback URL that handles OAuth, NOT your app URL.

### 4. Optional: Add Development URLs
For testing, you may also add:
```
http://localhost:3000/auth/callback
```

### 5. Save Changes
- Click **Save**
- Wait 5-10 minutes for changes to propagate

## How OAuth Flow Works:
1. User clicks login → Goes to Google
2. User authorizes → Google redirects to **Supabase** (`ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback`)
3. Supabase processes auth → Redirects to **your app** (`/auth/callback`)
4. Your app handles the code exchange → User logged in

## Current Issue:
Google OAuth Console probably has old URLs like:
- `https://prismy-production-1rrddzrb5-nclamvn-gmailcoms-projects.vercel.app/auth/callback` ❌
- `https://prismy.in/auth/callback` ❌

Should be:
- `https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback` ✅

## After Fixing:
Test OAuth flow at: https://prismy-production-bs1l4804o-nclamvn-gmailcoms-projects.vercel.app/oauth-test