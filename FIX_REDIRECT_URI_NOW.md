# 🚨 FIX REDIRECT URI MISMATCH - NGAY LẬP TỨC!

## ❌ LỖI HIỆN TẠI:
```
Lỗi 400: redirect_uri_mismatch
```

## 🔧 SỬA NGAY TRONG GOOGLE CONSOLE:

### 1. VÀO GOOGLE CLOUD CONSOLE:
```
https://console.cloud.google.com/apis/credentials
```

### 2. TÌM OAUTH CLIENT CỦA BẠN:
- Click vào OAuth 2.0 Client ID của Prismy

### 3. KIỂM TRA "Authorized redirect URIs":
Phải có CHÍNH XÁC các URLs sau:
```
https://prismy.in/auth/callback
https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback
```

### 4. NẾU THIẾU, THÊM NGAY:
- Click "+ ADD URI"
- Paste từng URL trên
- Click "SAVE"

### 5. KIỂM TRA "Authorized JavaScript origins":
Phải có:
```
https://prismy.in
https://ziyereoasqiqhjvedgit.supabase.co
```

## 🎯 QUAN TRỌNG:
- URLs phải CHÍNH XÁC, không có dấu "/" ở cuối
- Phân biệt HOA/thường
- Không có khoảng trắng

## 📸 SCREENSHOT CẦN THIẾT:
Sau khi sửa, chụp màn hình:
1. Authorized JavaScript origins
2. Authorized redirect URIs

## ✅ SAU KHI SAVE:
1. Đợi 2-3 phút để Google update
2. Test lại: https://prismy.in/test-fresh-oauth-local.html
3. Click "Test Google OAuth"

## 🔍 DEBUG THÊM:
Nếu vẫn lỗi, check Supabase Dashboard:
1. Vào: https://ziyereoasqiqhjvedgit.supabase.co/project/default/auth/providers
2. Click Google provider
3. Verify Client ID & Secret đúng với Google Console

---

# EXPECTED RESULT AFTER FIX:
✅ Click "Test Google OAuth" → Redirect to Google → Select account → Return to app → "✅ Authenticated!"