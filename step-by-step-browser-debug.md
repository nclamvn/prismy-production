# 🔍 STEP-BY-STEP BROWSER DEBUGGING

## 🚨 CRITICAL: Hãy làm CHÍNH XÁC theo từng bước này

### BƯỚC 1: Mở Browser và Developer Tools

1. **Mở Chrome/Edge** (không dùng Safari)
2. **Vào URL**: https://prismy-production-l05nx0orj-nclamvn-gmailcoms-projects.vercel.app/login
3. **Press F12** để mở Developer Tools
4. **Click tab "Network"** 
5. **Click "Clear"** (icon thùng rác) để xóa logs cũ
6. **Check "Preserve log"** (checkbox)

### BƯỚC 2: Bắt đầu OAuth Flow

1. **Click "Continue with Google"** button
2. **ĐỪNG ĐÓNG Developer Tools**
3. **Hoàn thành OAuth flow** (chọn Google account)
4. **Chờ đến khi redirect hoàn tất**

### BƯỚC 3: Phân tích Network Requests

Trong tab **Network**, hãy tìm các requests theo thứ tự:

**Request 1: Google OAuth Redirect**
- URL bắt đầu: `accounts.google.com/oauth/authorize`
- Status: `302` hoặc `200`
- Method: `GET`

**Request 2: OAuth Callback**
- URL: `*/auth/callback?code=...`
- Status: `302` hoặc `307`
- Method: `GET`

**Request 3: Final Redirect**
- URL: Có thể là `/app` hoặc `/login`
- Status: `200` hoặc `302`

### BƯỚC 4: Chi tiết cần check

**Nếu Request 2 (callback) có vấn đề:**

1. **Click vào callback request**
2. **Xem tab "Headers"**
3. **Tìm "Response Headers" → "Location"**
4. **Copy URL redirect này và gửi cho tôi**

**Nếu redirect về `/login`:**
5. **Xem "Query String Parameters"**
6. **Tìm `error` và `error_description`**
7. **Copy toàn bộ error message**

### BƯỚC 5: Console Errors

1. **Click tab "Console"** 
2. **Tìm bất kỳ error nào** (text màu đỏ)
3. **Copy toàn bộ error messages**

### BƯỚC 6: Cookies Check

1. **Click tab "Application"**
2. **Expand "Cookies"** trong sidebar trái
3. **Click vào domain của bạn**
4. **Tìm cookies**: `sb-access-token`, `sb-refresh-token`
5. **Check xem có được set không**

## 📋 THÔNG TIN CẦN GỬI CHO TÔI

Hãy copy và paste những thông tin này:

### A. Callback Request Details
```
URL: [paste callback URL here]
Status Code: [paste status code]
Response Location Header: [paste redirect URL]
Error Parameters: [paste any error=... parameters]
```

### B. Console Errors
```
[paste any red error messages from console]
```

### C. Cookies Status
```
sb-access-token: [present/missing]
sb-refresh-token: [present/missing]
```

### D. Final Behavior
```
After OAuth, I land on: [/login or /app or other page]
```

## 🎯 COMMON ISSUES TO LOOK FOR

### Issue 1: Callback returns error
**Look for**: `error=access_denied` hoặc `error=invalid_request`
**Means**: Google OAuth configuration problem

### Issue 2: Callback redirects to login with error
**Look for**: `auth/callback → 302 → /login?error=...`
**Means**: Supabase auth code exchange failed

### Issue 3: No cookies set after OAuth
**Look for**: Missing `sb-access-token` cookie
**Means**: Session creation failed

### Issue 4: App page immediately redirects
**Look for**: `/app → 302 → /login`
**Means**: Middleware doesn't recognize session

## 🚀 CRITICAL NEXT STEP

**Hãy làm chính xác các bước trên và gửi cho tôi 4 thông tin A, B, C, D.**

Với thông tin chi tiết này, tôi sẽ xác định chính xác vấn đề và fix trong 1 lần!