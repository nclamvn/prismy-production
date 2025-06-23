# 🚨 CRITICAL: Supabase OAuth Configuration

## ⚠️ BƯỚC BẮT BUỘC - KHÔNG THỂ BỎ QUA

**Google OAuth sẽ KHÔNG hoạt động nếu không thực hiện cấu hình này.**

### 🔧 **Bước 1: Supabase Dashboard**

1. **Truy cập**: https://app.supabase.com
2. **Chọn project**: ziyereoasqiqhjvedgit
3. **Authentication** → **URL Configuration**
4. **Redirect URLs** → **Add URL**

### 📝 **URLs cần thêm (CHÍNH XÁC):**

```bash
# Production URLs
https://prismy.in/auth/callback
https://www.prismy.in/auth/callback

# Development URLs
http://localhost:3001/auth/callback

# Vercel Preview URLs (EXACT - wildcard might not work)
https://prismy-production-j57t6g92b-nclamvn-gmailcoms-projects.vercel.app/auth/callback

# Alternative wildcard (if above doesn't work)
https://prismy-production-*.vercel.app/auth/callback
```

### 🎯 **Hướng dẫn chi tiết:**

1. **Click "Add URL"**
2. **Paste từng URL một** (không paste all cùng lúc)
3. **Click "Save"** sau mỗi URL
4. **Verify** tất cả URLs appear trong danh sách

### ✅ **Kiểm tra hoàn tất:**

Redirect URLs list phải bao gồm:

- ✅ https://prismy.in/auth/callback
- ✅ https://www.prismy.in/auth/callback
- ✅ http://localhost:3001/auth/callback
- ✅ https://prismy-production-\*.vercel.app/auth/callback

### 🔍 **Xác nhận Google OAuth vẫn hoạt động:**

Trong **Providers** section:

- ✅ **Google** provider phải enabled
- ✅ **Client ID** và **Client Secret** phải có giá trị
- ✅ **Redirect URL** phải là: `https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback`

---

## 🧪 **Test ngay sau khi cấu hình:**

1. **Clear browser cache** cho prismy.in
2. **Go to**: https://prismy.in
3. **Click**: "Get Started"
4. **Click**: "Continue with Google"
5. **Should**: Redirect to Google → Auth → Back to workspace

---

## 🚨 **Nếu vẫn lỗi sau config:**

### **Error: "Invalid redirect URI"**

→ Double-check URLs đã được thêm chính xác

### **Error: "Provider not found"**

→ Check Google provider settings

### **Màn hình nháy không redirect**

→ Check browser console cho error logs

---

**⚡ STATUS: Cấu hình này là BLOCKING ISSUE - phải hoàn thành trước khi test bất kỳ tính năng auth nào khác.**
