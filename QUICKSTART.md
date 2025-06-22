# 🚀 PRISMY QUICK START

## 🎯 Mục tiêu

Giúp bạn cấu hình Prismy chạy được authentication trong 15 phút.

## ⚡ Bước nhanh

### 1. Kiểm tra cấu hình hiện tại

```bash
node check-config.mjs
```

### 2. Tạo Supabase Project (5 phút)

1. Vào https://supabase.com → Sign Up → New Project
2. Tên: `prismy-production`, Region: `Singapore`
3. Copy 3 API keys vào `.env.local`

### 3. Chạy Database Setup (2 phút)

1. Vào Supabase → SQL Editor
2. Copy nội dung `supabase-setup.sql` → Run
3. Copy nội dung `supabase-stripe-migration.sql` → Run

### 4. Cấu hình Auth (3 phút)

1. Vào Authentication → Settings
2. Site URL: `https://prismy.in`
3. Disable "Enable email confirmations"

### 5. Google Translate API (5 phút)

1. Vào https://console.cloud.google.com
2. New Project → Enable "Cloud Translation API"
3. Create API Key → Copy vào `.env.local`

### 6. Test Local

```bash
npm run dev
```

Truy cập http://localhost:3000 và thử đăng ký account.

### 7. Deploy Production

```bash
vercel --prod
```

## ✅ Checklist nhanh

```bash
# Bắt buộc có để authentication hoạt động:
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ GOOGLE_CLOUD_PROJECT_ID
✓ GOOGLE_TRANSLATE_API_KEY
✓ NEXT_PUBLIC_SITE_URL=https://prismy.in
```

## 🆘 Gặp lỗi?

### Lỗi "Failed to fetch"

→ Kiểm tra Supabase keys chính xác

### Lỗi đăng nhập redirect về home

→ Chưa có database tables, chạy lại SQL migrations

### Google login không hoạt động

→ Cần setup OAuth (xem HUONG_DAN_CAU_HINH_PRISMY.md)

## 📞 Support

- Docs: HUONG_DAN_CAU_HINH_PRISMY.md
- Check: `node check-config.mjs`
- Logs: Browser Console + Vercel Functions
