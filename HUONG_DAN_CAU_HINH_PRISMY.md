# 🚀 HƯỚNG DẪN CẤU HÌNH PRISMY CHO PRODUCTION

## 📋 Tổng quan

Tài liệu này hướng dẫn chi tiết cách cấu hình Prismy để chạy thực tế trên domain prismy.in. Hiện tại bạn đã có code hoàn chỉnh nhưng cần cấu hình các dịch vụ bên ngoài.

## 🔴 Lỗi hiện tại

Khi truy cập https://prismy.in/workspace:

- Hiển thị "Authentication Required"
- Khi nhấn Sign In bị redirect về trang chủ
- Google/Apple login báo lỗi

**Nguyên nhân**: Chưa cấu hình Supabase và các dịch vụ cần thiết.

## ✅ Các bước cấu hình

### 1️⃣ BƯỚC 1: THIẾT LẬP SUPABASE (BẮT BUỘC)

Supabase xử lý toàn bộ authentication và database cho Prismy.

#### A. Tạo Supabase Project

1. Truy cập https://supabase.com và đăng ký tài khoản
2. Click "New project"
3. Điền thông tin:
   - Project name: `prismy-production`
   - Database Password: (tạo password mạnh)
   - Region: `Southeast Asia (Singapore)` (gần VN nhất)
4. Click "Create new project" và đợi ~2 phút

#### B. Lấy API Keys

1. Vào Settings → API
2. Copy các giá trị sau vào file `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
   SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
   ```

#### C. Chạy Database Migration

1. Vào SQL Editor trong Supabase Dashboard
2. Copy toàn bộ nội dung file `supabase-setup.sql`
3. Paste vào SQL Editor và click "Run"
4. Làm tương tự với file `supabase-stripe-migration.sql`

#### D. Cấu hình Authentication

1. Vào Authentication → Settings
2. Site URL: `https://prismy.in`
3. Redirect URLs thêm:
   - `https://prismy.in/**`
   - `https://prismy.in/workspace`
   - `https://prismy.in/dashboard`
4. Disable "Enable email confirmations" (để test dễ hơn)

### 2️⃣ BƯỚC 2: GOOGLE CLOUD TRANSLATE API (BẮT BUỘC)

#### A. Tạo Google Cloud Project

1. Truy cập https://console.cloud.google.com
2. Click "Create Project"
3. Project name: `prismy-translate`
4. Đợi project được tạo

#### B. Enable Translate API

1. Vào APIs & Services → Library
2. Tìm "Cloud Translation API"
3. Click vào và nhấn "Enable"
4. Chờ API được kích hoạt

#### C. Tạo API Key

1. Vào APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy API key vào `.env.local`:
   ```
   GOOGLE_TRANSLATE_API_KEY=[YOUR_API_KEY]
   ```
4. Click "Edit API Key" để giới hạn:
   - Application restrictions: HTTP referrers
   - Website restrictions:
     - `https://prismy.in/*`
     - `http://localhost:3000/*`
   - API restrictions: Cloud Translation API

#### D. Tạo Service Account (Optional nhưng recommended)

1. Vào IAM & Admin → Service Accounts
2. Create Service Account:
   - Name: `prismy-translator`
   - Role: `Cloud Translation API User`
3. Create Key (JSON format)
4. Download file JSON và lưu an toàn
5. Cập nhật `.env.local`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=[YOUR_PROJECT_ID]
   ```

### 3️⃣ BƯỚC 3: GOOGLE OAUTH (BẮT BUỘC CHO GOOGLE LOGIN)

#### A. Cấu hình OAuth Consent Screen

1. Trong Google Cloud Console
2. Vào APIs & Services → OAuth consent screen
3. User Type: External
4. Điền thông tin:
   - App name: `Prismy`
   - User support email: `your-email@gmail.com`
   - App logo: upload logo Prismy
   - App domain: `https://prismy.in`
   - Privacy policy: `https://prismy.in/privacy`
   - Terms of service: `https://prismy.in/terms`

#### B. Tạo OAuth Client

1. Vào Credentials → Create Credentials → OAuth client ID
2. Application type: `Web application`
3. Name: `Prismy Web Client`
4. Authorized redirect URIs thêm:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```
5. Copy Client ID và Client Secret

#### C. Cấu hình trong Supabase

1. Vào Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Paste Client ID và Client Secret
4. Save

### 4️⃣ BƯỚC 4: APPLE SIGN-IN (TÙY CHỌN)

Cần Apple Developer Account ($99/năm). Nếu chưa có, có thể bỏ qua.

### 5️⃣ BƯỚC 5: THANH TOÁN (TÙY CHỌN CHO MVP)

Có thể bỏ qua nếu chỉ muốn test authentication. Khi cần, tham khảo:

- `STRIPE_SETUP.md` cho thanh toán quốc tế
- `VIETNAMESE_PAYMENT_SETUP.md` cho VNPay/MoMo

### 6️⃣ BƯỚC 6: AI PROVIDERS (TÙY CHỌN)

Nếu có API keys cho OpenAI/Anthropic, thêm vào `.env.local`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 🚀 Deploy lại với cấu hình mới

1. Kiểm tra file `.env.local` đã điền đủ thông tin cần thiết
2. Test local trước:
   ```bash
   npm run dev
   ```
3. Truy cập http://localhost:3000 và test đăng nhập
4. Nếu OK, deploy lên production:
   ```bash
   vercel --prod
   ```

## ✅ Checklist kiểm tra

- [ ] Supabase project đã tạo và lấy được API keys
- [ ] Database migrations đã chạy thành công
- [ ] Google Cloud Project đã tạo
- [ ] Google Translate API đã enable
- [ ] Google OAuth đã cấu hình (nếu cần Google login)
- [ ] File .env.local đã điền đủ thông tin bắt buộc
- [ ] Test đăng nhập thành công ở localhost
- [ ] Deploy production thành công

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Failed to fetch" khi đăng ký

- Kiểm tra Supabase URL và keys chính xác
- Disable email confirmation trong Supabase
- Kiểm tra network tab trong browser console

### Lỗi Google Login redirect

- Kiểm tra redirect URI khớp chính xác
- Format: `https://[PROJECT_ID].supabase.co/auth/v1/callback`
- Thêm cả trailing slash nếu cần

### Lỗi Translation API

- Kiểm tra API đã enable
- Kiểm tra quota và billing
- Test với Postman/curl trước

## 📞 Hỗ trợ

Nếu gặp vấn đề:

1. Check browser console cho error details
2. Xem logs trong Supabase Dashboard
3. Kiểm tra Vercel Function Logs

## 🎯 Bước tiếp theo

Sau khi authentication hoạt động:

1. Test tạo account mới
2. Test Google login
3. Test workspace các features
4. Cấu hình payment nếu cần
5. Setup monitoring (Sentry)

---

**Lưu ý**: File này chứa hướng dẫn chi tiết cho production. Giữ bảo mật các API keys và không commit vào git.
