# 🔧 FIX SUPABASE CONFIGURATION MISMATCH

## 🚨 VẤN ĐỀ PHÁT HIỆN

Supabase đang cấu hình cho:
- Site URL: `https://www.prismy.in`  
- Redirect URLs: `https://www.prismy.in/*`, `https://prismy.in/*`

Nhưng deployment hiện tại chạy trên:
- **Current URL**: `https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app`

➡️ **Mismatch này gây ra OAuth redirect loop!**

## ✅ GIẢI PHÁP NGAY LẬP TỨC

### OPTION 1: Cập nhật Supabase cho Vercel URL (RECOMMENDED)

1. **Vào Supabase Dashboard** → Authentication → URL Configuration

2. **Thay đổi Site URL:**
   ```
   https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app
   ```

3. **Thêm Redirect URL mới:**
   ```
   https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app/auth/callback
   ```

4. **Giữ lại các redirect URLs cũ** (để dev và production đều hoạt động)

### OPTION 2: Deploy lên Custom Domain

Nếu bạn muốn sử dụng `prismy.in`:

1. **Cấu hình Custom Domain trong Vercel:**
   - Vào Vercel Dashboard → Project Settings → Domains
   - Add domain: `www.prismy.in` và `prismy.in`
   - Cấu hình DNS records

2. **Deploy lại với custom domain**

## 🎯 BƯỚC TIẾP THEO

**Để test nhanh nhất:**

1. ✅ **Update Supabase Site URL** thành Vercel URL hiện tại
2. ✅ **Thêm Vercel redirect URL** vào allow list  
3. ✅ **Test OAuth flow** ngay lập tức
4. ✅ **Deploy custom domain** sau (optional)

## 📋 UPDATED SUPABASE CONFIG

**Site URL:**
```
https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app
```

**Redirect URLs (keep all):**
```
https://www.prismy.in/*
https://prismy.in/*
https://prismy-production.vercel.app/*
http://localhost:3000/*
https://prismy.in/auth/callback
https://www.prismy.in/auth/callback
http://localhost:3001/auth/callback
https://prismy-production-*.vercel.app/auth/callback
https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app/auth/callback
```

## 🔍 VERIFY AFTER UPDATE

Test OAuth tại: https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app/login

Expected flow:
1. Click "Continue with Google" 
2. Redirect to Google OAuth
3. Select account
4. Redirect back to `/app` page ✅
5. NOT redirect back to `/login` ❌