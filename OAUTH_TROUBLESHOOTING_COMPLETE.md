# 🚨 OAUTH TROUBLESHOOTING - COMPLETE GUIDE

## 🎯 **ĐÃ CẤU HÌNH SUPABASE NHƯNG VẪN LỖI**

### **❗ VERIFICATION CHECKLIST**

#### **1. Kiểm tra Supabase Dashboard**

- ✅ **Đi tới**: https://app.supabase.com → Project → Authentication → URL Configuration
- ✅ **Confirm có EXACT URLs này**:
  ```
  https://prismy.in/auth/callback
  https://www.prismy.in/auth/callback
  http://localhost:3001/auth/callback
  https://prismy-production-j57t6g92b-nclamvn-gmailcoms-projects.vercel.app/auth/callback
  ```

#### **2. Google Cloud Console Verification**

- ✅ **Đi tới**: https://console.cloud.google.com → APIs & Services → Credentials
- ✅ **Confirm Authorized redirect URIs có**:
  ```
  https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback
  ```

---

## 🔧 **DEBUGGING STEPS**

### **Step 1: Environment Variables Check**

```bash
# Test tại: https://prismy.in/debug/env
# Hoặc: https://prismy-production-j57t6g92b-nclamvn-gmailcoms-projects.vercel.app/debug/env
```

**Expected values**:

- `NEXT_PUBLIC_SUPABASE_URL`: `https://ziyereoasqiqhjvedgit.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Should exist và not empty

### **Step 2: Browser Console Debugging**

```javascript
// Clear all debug logs
__prismyAuthDebug.clear()

// Try Google OAuth
// Click Google Sign In button

// Check logs immediately
__prismyAuthDebug.getEvents()

// Get full report
__prismyAuthDebug.getReport()
```

### **Step 3: Network Tab Analysis**

1. **Open DevTools** → Network tab
2. **Click "Continue with Google"**
3. **Look for failed requests**:
   - Any 400/401/403 errors?
   - Any CORS errors?
   - Any redirect failures?

### **Step 4: Manual Callback Test**

**Direct access**: https://prismy.in/auth/callback
**Expected**: Redirect to home với error `no_code`
**If 404**: Route handler not deployed correctly

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue 1: "Redirect URI Mismatch"**

**Symptom**: Google shows "redirect_uri_mismatch" error
**Fix**:

1. Copy exact callback URL từ error message
2. Add to Google Cloud Console Authorized redirect URIs

### **Issue 2: "Invalid Redirect URL"**

**Symptom**: Supabase rejects OAuth request
**Fix**:

1. Double-check URLs trong Supabase dashboard
2. Wait 5-10 minutes for propagation
3. Try exact Vercel URL thay vì wildcard

### **Issue 3: "Network Error"**

**Symptom**: OAuth fails với network/CORS errors
**Fix**:

1. Check environment variables
2. Verify Supabase project URL correct
3. Check if API keys expired

### **Issue 4: "Silent Failure"**

**Symptom**: Modal nháy, không redirect, không error
**Fix**:

```javascript
// Check console for this specific error:
console.log(__prismyAuthDebug.getEvents().filter(e => e.level === 'error'))
```

---

## 🧪 **SYSTEMATIC TESTING**

### **Test 1: Basic Connection**

```bash
curl https://ziyereoasqiqhjvedgit.supabase.co/rest/v1/
# Should return Supabase info
```

### **Test 2: Callback Route**

```bash
curl https://prismy.in/auth/callback
# Should redirect to home with no_code error
```

### **Test 3: OAuth Initiation**

1. **Open**: https://prismy.in
2. **DevTools Console**: `__prismyAuthDebug.clear()`
3. **Click**: "Get Started" → "Continue with Google"
4. **Check**: `__prismyAuthDebug.getEvents()`

**Expected logs**:

```
🔍 [MODAL] Modal opened
🔍 [MODAL] google OAuth initiated
🔍 [CONTEXT] google OAuth initiated
```

**If missing**: Auth context/modal not working properly

---

## 🔄 **FALLBACK SOLUTIONS**

### **Option A: Force Refresh Config**

```javascript
// Clear all caches
localStorage.clear()
sessionStorage.clear()
// Hard refresh (Ctrl+Shift+R)
```

### **Option B: Test Alternate Domain**

- Try direct Vercel URL thay vì custom domain
- Có thể custom domain có caching issues

### **Option C: Environment Reset**

1. **Redeploy** với fresh environment variables
2. **Verify** all env vars trong Vercel dashboard
3. **Test** ngay sau deploy

---

## 📊 **SUCCESS INDICATORS**

### **✅ Working OAuth Flow**

```javascript
// Console should show:
[INFO] Modal opened
[INFO] google OAuth initiated
[INFO] Session updated (user: true)
[SUCCESS] Auth callback success
```

### **✅ Working Redirect**

- User clicks Google → Redirects to Google
- User authenticates → Returns to prismy.in
- User lands in intended destination (workspace/current page)

---

## 🆘 **ESCALATION**

### **If All Else Fails**

1. **Copy full debug report**: `__prismyAuthDebug.copy()`
2. **Check Vercel logs**: Function logs trong dashboard
3. **Check Supabase logs**: Authentication logs trong dashboard
4. **Temporarily revert**: To direct redirect approach

---

**🎯 MOST LIKELY CAUSE: Wildcard URL không work, cần exact Vercel URL trong Supabase!**
