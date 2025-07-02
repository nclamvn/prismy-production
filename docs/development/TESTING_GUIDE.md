# 🧪 Hướng dẫn kiểm thử Prismy

## ✅ Trạng thái cấu hình hiện tại

### API Keys đã cấu hình:

- ✅ **Supabase**: URL, Anon Key, Service Role Key
- ✅ **Google Translate API**: Đã test thành công
- ✅ **OpenAI API Key**: Đã cấu hình
- ✅ **Anthropic API Key**: Đã cấu hình
- ✅ **Site URL**: https://prismy.in

## 🚀 1. Test trên Localhost (Port 3001)

### Khởi động ứng dụng:

```bash
# Server đang chạy tại: http://localhost:3001
npm run dev
```

### Test Authentication Flow:

1. Mở browser: http://localhost:3001
2. Click **"Bắt đầu"** hoặc **"Get Started"**
3. Chọn **"Sign in with Google"**
4. Đăng nhập với tài khoản Google
5. ✅ Sau khi xác thực → phải chuyển đến `/workspace`

### Test Translation Feature:

1. Trong workspace, click **"Upload Document"**
2. Upload file test (PDF, DOCX, TXT) - file nhỏ < 1MB
3. Chọn ngôn ngữ:
   - Source: English hoặc Auto-detect
   - Target: Vietnamese
4. Click **"Translate"**
5. ✅ Kết quả dịch phải hiển thị sau 2-5 giây

### Các lỗi có thể gặp:

#### 🔴 Google OAuth Error: "redirect_uri_mismatch"

**Nguyên nhân**: URL callback chưa được cấu hình
**Giải pháp**:

1. Vào [Google Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → OAuth 2.0 Client
3. Thêm Authorized redirect URIs:
   - `http://localhost:3001/**`
   - `https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback`

#### 🔴 Translation Error: "API key not valid"

**Nguyên nhân**: API key bị giới hạn domain
**Giải pháp**:

1. Vào Google Console → APIs & Services → Credentials
2. Edit API key → Application restrictions
3. Thêm localhost vào danh sách cho phép

## 🌐 2. Deploy Production

### Deploy lên Vercel:

```bash
vercel --prod --public
```

### Kiểm tra deployment:

1. Truy cập URL deployment mới
2. Test các tính năng giống localhost
3. Kiểm tra console log để debug

### Cấu hình domain (nếu cần):

1. Vào Vercel Dashboard
2. Project Settings → Domains
3. Add domain `prismy.in`
4. Cấu hình DNS theo hướng dẫn

## 📋 3. Checklist Production

| Hạng mục                   | Status | Ghi chú                  |
| -------------------------- | ------ | ------------------------ |
| ✅ API Keys configured     | ✓      | Đã test thành công       |
| ⚠️ Domain prismy.in        | ?      | Cần kiểm tra DNS         |
| ✅ Google OAuth localhost  | ✓      | Working                  |
| ⚠️ Google OAuth production | ?      | Cần thêm production URLs |
| ✅ Translation API         | ✓      | Working                  |
| ⚠️ Database migrations     | ?      | Cần chạy SQL             |
| ✅ Environment variables   | ✓      | Đã cấu hình đầy đủ       |

## 🔍 4. Debug Commands

### Check logs:

```bash
# Development logs
npm run dev

# Vercel logs
vercel logs

# Check environment
vercel env ls
```

### Test API endpoints:

```bash
# Test translation API
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","sourceLang":"en","targetLang":"vi"}'

# Test auth status
curl http://localhost:3001/api/auth/session
```

## 🚨 5. Monitoring & Error Tracking

### Browser DevTools:

- **Network Tab**: Kiểm tra API calls
- **Console**: Xem error messages
- **Application Tab**: Check cookies/storage

### Common Issues:

1. **CORS errors**: Kiểm tra allowed origins
2. **401 Unauthorized**: Check API keys
3. **Rate limit**: Check quota Google Cloud
4. **File upload fails**: Check size limits

## 📝 6. Next Steps

### Khi test thành công:

1. ✅ Chạy database migrations
2. ✅ Cấu hình production OAuth URLs
3. ✅ Enable billing Google Cloud
4. ✅ Set up monitoring (Sentry)
5. ✅ Configure email templates

### Production checklist:

- [ ] Remove test API keys
- [ ] Enable RLS policies in Supabase
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Add custom error pages

---

## 🆘 Support

Nếu gặp lỗi:

1. Check console logs
2. Verify environment variables
3. Test API keys individually
4. Check network requests

**Test URL hiện tại**: http://localhost:3001
