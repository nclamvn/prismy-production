# 🔥 NUCLEAR RESET - STEP BY STEP CHECKLIST

## 🚨 CRITICAL: Làm theo ĐÚNG THỨ TỰ từng bước

---

## ✅ PHASE 1: XÓA SẠCH (CỰC KỲ QUAN TRỌNG)

### 🗑️ Step 1.1: Xóa Google OAuth App Cũ
```
1. Vào: https://console.cloud.google.com/apis/credentials
2. Tìm OAuth client ID hiện tại cho Prismy 
3. Click vào tên OAuth client
4. Click "DELETE" ở góc trên
5. Confirm "DELETE" 
6. Chờ 2-3 phút để Google update
```

### 🗑️ Step 1.2: Reset Supabase Auth HOÀN TOÀN
```
1. Vào: https://ziyereoasqiqhjvedgit.supabase.co/project/default/auth/providers
2. Click vào "Google" provider
3. Toggle "Enable sign in with Google" → OFF
4. Clear hết Client ID và Client Secret fields
5. Save configuration
6. Vào "URL Configuration" tab
7. Clear hết Site URL và Redirect URLs
8. Save configuration
```

### 🗑️ Step 1.3: Clear Browser Data TOÀN BỘ
```
1. Chrome → Settings → Privacy and security → Clear browsing data
2. Time range: "All time"
3. Check ALL boxes:
   ✅ Browsing history
   ✅ Cookies and other site data
   ✅ Cached images and files
   ✅ Download history
   ✅ Autofill form data
   ✅ Site settings
   ✅ Hosted app data
4. Click "Clear data"
5. RESTART browser completely
6. Verify cleared: Không còn auto-login trên bất kỳ site nào
```

---

## 🆕 PHASE 2: TẠO MỚI HOÀN TOÀN

### 🔑 Step 2.1: Tạo Google OAuth App MỚI
```
1. Vào: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS"
3. Select "OAuth client ID"
4. Application type: "Web application"
5. Name: "Prismy Fresh OAuth 2025"
6. Authorized JavaScript origins:
   Add: https://prismy.in
7. Authorized redirect URIs:
   Add: https://prismy.in/auth/callback
8. Click "CREATE"
9. Copy CLIENT_ID (starts with numbers)
10. Copy CLIENT_SECRET (random string)
11. Keep tab open - cần dùng ngay
```

### 📝 Step 2.2: Config OAuth Consent Screen
```
1. Vào: OAuth consent screen (left sidebar)
2. User Type: "External" (if not set)
3. App information:
   - App name: "Prismy"
   - User support email: [your-gmail@gmail.com]
   - App logo: (optional, skip)
4. App domain:
   - Application home page: https://prismy.in
   - Application privacy policy: https://prismy.in/privacy
   - Application terms of service: https://prismy.in/terms
5. Authorized domains:
   Add: prismy.in
6. Developer contact information: [your-gmail@gmail.com]
7. Click "SAVE AND CONTINUE"
8. Scopes page: Click "SAVE AND CONTINUE" (use defaults)
9. Test users: Add your Gmail address
10. Click "SAVE AND CONTINUE"
```

### 🔧 Step 2.3: Setup Supabase Auth MỚI
```
1. Vào: https://ziyereoasqiqhjvedgit.supabase.co/project/default/auth/settings
2. URL Configuration:
   - Site URL: https://prismy.in
   - Redirect URLs: https://prismy.in/auth/callback
3. Save configuration
4. Vào: Auth → Providers
5. Find "Google" provider
6. Toggle "Enable sign in with Google" → ON
7. Paste:
   - Client ID: [from step 2.1]
   - Client Secret: [from step 2.1]
8. Save configuration
9. Wait 30 seconds for changes to propagate
```

---

## 🧪 PHASE 3: TEST BASIC SETUP

### 🔬 Step 3.1: Test Fresh Environment
```
1. Open NEW incognito window
2. Navigate to: https://prismy.in/test-fresh-oauth.html
3. Page should load with colorful interface
4. Click "Test Supabase" button
5. Should show: "✅ Supabase Connected"
6. If ❌ error → Stop here, fix Supabase config first
```

### 🔬 Step 3.2: Test OAuth Initiation
```
1. Same incognito window
2. Click "🔑 Test Fresh Google OAuth" button
3. Expected behavior:
   - Should redirect to Google login page
   - URL should start with: accounts.google.com
   - Should show your Gmail account to select
4. If ❌ error → Google OAuth app config wrong
5. If no redirect → Check browser console for errors
```

### 🔬 Step 3.3: Complete OAuth Flow
```
1. Select your Gmail account
2. Grant permissions (if asked)
3. Should redirect back to: https://prismy.in/test-fresh-oauth.html
4. Page should show: "✅ OAuth callback received!"
5. Click "Check Current Auth" button
6. Should show: "✅ Authenticated" with your email
7. If stuck on Google → Check authorized domains
8. If redirect fails → Check redirect URIs exact match
```

---

## 🎯 EXPECTED RESULTS

### ✅ SUCCESS Indicators:
```
✅ Google OAuth app shows "Active" status
✅ Supabase shows "Google provider enabled"
✅ Test page shows "✅ Supabase Connected"
✅ OAuth redirects to Google successfully
✅ Returns to callback with user authenticated
✅ No console errors in browser DevTools
```

### ❌ FAILURE Points & Solutions:
```
❌ "OAuth initiation failed" 
   → Check Google OAuth app Client ID/Secret
   
❌ "Connection failed"
   → Check Supabase URL/API key
   
❌ Stuck on Google login
   → Check authorized domains include prismy.in
   
❌ "Invalid redirect URI"
   → Check exact match: https://prismy.in/auth/callback
   
❌ "access_denied"
   → Check OAuth consent screen published
```

---

## 🚨 CRITICAL DEBUGGING

### If Test STILL Fails After Fresh Setup:

```
1. Check Google Cloud Console → OAuth consent screen → Publishing status
2. Verify Gmail account is added as test user
3. Try different Gmail account
4. Test from different network/device
5. Check if corporate firewall blocking OAuth
6. Try mobile hotspot to rule out network issues
```

### Console Debugging Commands:
```javascript
// Run in browser console
console.log('Current URL:', window.location.href)
console.log('User Agent:', navigator.userAgent)
console.log('Local Storage:', localStorage)
console.log('Session Storage:', sessionStorage)
console.log('Cookies:', document.cookie)
```

---

## 📊 REPORT RESULTS

### After Each Phase, Report:
```
Phase 1 Complete: ✅/❌ + any errors
Phase 2 Complete: ✅/❌ + config screenshots  
Phase 3 Results: ✅/❌ + exact error messages
```

### Critical Info to Share:
```
- Which step failed exactly
- Error messages in browser console
- Screenshots of Google/Supabase config
- Network tab showing failed requests
- User agent and browser version
```

---

## 🎯 NEXT STEPS

**✅ If Fresh Test WORKS:**
- Apply same config to main app
- OAuth will work immediately
- Problem was config pollution

**❌ If Fresh Test FAILS:**
- Infrastructure/network issue
- Not a config problem
- May need alternative auth method
- Deep dive into Google account restrictions

---

**BẮT ĐẦU VỚI PHASE 1 - XÓA SẠCH TRƯỚC!**