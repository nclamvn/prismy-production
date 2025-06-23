# 🚀 Hướng dẫn cấu hình Prismy Production

## 🔴 Vấn đề hiện tại

1. **Domain prismy.in**: Chưa được cấu hình DNS
2. **Vercel deployment**: Đang bị password protection (401 error)
3. **Environment variables**: Cần sync từ local lên Vercel

## ✅ Các bước cấu hình

### 1️⃣ **Cấu hình Vercel Dashboard**

1. Truy cập: https://vercel.com/dashboard
2. Chọn project: **prismy-production**
3. Vào **Settings**

### 2️⃣ **Tắt Password Protection**

```
Settings → General → Password Protection → Disable
```

### 3️⃣ **Thêm Environment Variables**

```
Settings → Environment Variables → Add New
```

Thêm các biến sau cho **Production**:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Translate (Required)
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://prismy.in

# AI Providers (Optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4️⃣ **Cấu hình Domain**

```
Settings → Domains → Add Domain
```

1. Nhập: **prismy.in**
2. Vercel sẽ hiển thị DNS records cần cấu hình:

```
A Record:
Name: @
Value: 76.76.21.21

CNAME Record:
Name: www
Value: cname.vercel-dns.com
```

3. Vào domain provider (nơi bạn mua domain) và thêm các records trên

### 5️⃣ **Google OAuth Configuration**

Vào [Google Cloud Console](https://console.cloud.google.com):

1. APIs & Services → Credentials → OAuth 2.0 Client
2. Thêm Authorized redirect URIs:

```
https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback
https://prismy.in/api/auth/callback/google
https://www.prismy.in/api/auth/callback/google
https://prismy-production-*.vercel.app/api/auth/callback/google
```

### 6️⃣ **Redeploy**

Sau khi cấu hình xong:

```bash
vercel --prod
```

## 🧪 Test Production

### URL để test:

- **Nếu DNS đã cấu hình**: https://prismy.in
- **Deployment URL**: https://prismy-production-[hash].vercel.app

### Test checklist:

1. ✅ Truy cập được trang chủ
2. ✅ Click "Get Started" → Auth modal xuất hiện
3. ✅ Sign in with Google → Redirect to /workspace
4. ✅ Upload document → Translate → Kết quả hiển thị

## 🔧 Troubleshooting

### Lỗi "Password Required"

→ Tắt password protection trong Vercel dashboard

### Lỗi "redirect_uri_mismatch"

→ Thêm production URLs vào Google OAuth

### Domain không hoạt động

→ Đợi 24-48h để DNS propagate
→ Kiểm tra DNS records đã đúng chưa

### Translation API không hoạt động

→ Kiểm tra API key trong Vercel env vars
→ Enable billing trong Google Cloud

## 📱 Alternative Testing

Nếu chưa cấu hình xong domain, có thể:

1. **Test trên localhost**:

   ```bash
   npm run dev
   # http://localhost:3001
   ```

2. **Share deployment URL**:

   - Copy URL từ `vercel ls`
   - Share cho team test

3. **Use ngrok** (optional):
   ```bash
   ngrok http 3001
   # Sẽ tạo public URL cho localhost
   ```

---

**Status hiện tại:**

- ✅ Code đã deploy
- ✅ Environment variables local OK
- ⚠️ Cần sync env vars lên Vercel
- ⚠️ Cần tắt password protection
- ⚠️ Cần cấu hình DNS cho prismy.in
