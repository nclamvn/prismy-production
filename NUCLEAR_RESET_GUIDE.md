# 🔥 NUCLEAR RESET - OAuth From Scratch

## Tình huống: Mọi cách đã thử đều thất bại

Khi config cũ bị "nhiễm độc", cách duy nhất là **XÓA SẠCH** và **TẠO MỚI HOÀN TOÀN**.

---

## 🗑️ PHASE 1: XÓA SẠCH MỌI THỨ CỦ

### 1.1. Xóa Google OAuth App Cũ

```
1. Vào: https://console.cloud.google.com/apis/credentials
2. Tìm OAuth client hiện tại cho Prismy
3. Click "DELETE" - xóa hoàn toàn
4. Confirm deletion
```

### 1.2. Reset Supabase Auth Settings

```
1. Vào: https://ziyereoasqiqhjvedgit.supabase.co/project/default/auth/providers
2. Disable ALL providers (Google, etc.)
3. Clear ALL redirect URLs
4. Clear site URL
5. Save changes
```

### 1.3. Clear Browser Data HOÀN TOÀN

```
1. Chrome → Settings → Privacy → Clear browsing data
2. Select: "All time"
3. Check ALL boxes:
   ✅ Cookies and site data
   ✅ Cached images and files
   ✅ Site settings
   ✅ Hosted app data
4. Clear data
5. Restart browser
```

---

## 🆕 PHASE 2: TẠO MỚI HOÀN TOÀN

### 2.1. Tạo Google OAuth App Mới

```
1. Vào: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → OAuth client ID
3. Application type: Web application
4. Name: "Prismy Production OAuth 2025"
5. Authorized JavaScript origins:
   https://prismy.in
6. Authorized redirect URIs:
   https://prismy.in/auth/callback
7. CREATE
8. Copy CLIENT_ID & CLIENT_SECRET
```

### 2.2. Cấu hình OAuth Consent Screen

```
1. Vào: OAuth consent screen
2. User Type: External
3. App name: "Prismy"
4. User support email: [your-email]
5. Developer contact: [your-email]
6. Authorized domains: prismy.in
7. Scopes: email, profile, openid
8. Test users: [add your gmail]
9. SAVE AND CONTINUE
```

### 2.3. Setup Supabase Auth Từ Đầu

```
1. Vào: Supabase Auth Settings
2. Site URL: https://prismy.in
3. Redirect URLs: https://prismy.in/auth/callback
4. Enable Google Provider:
   - Client ID: [from step 2.1]
   - Client Secret: [from step 2.1]
5. SAVE
```

---

## 🧪 PHASE 3: TEST MINIMAL SETUP

### 3.1. Tạo Test Page Hoàn Toàn Mới

Tạo file: `test-fresh-oauth.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Fresh OAuth Test</title>
</head>
<body>
    <h1>🆕 FRESH OAUTH TEST</h1>
    <button onclick="testLogin()">Test Google Login</button>
    <div id="result"></div>
    
    <script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
    <script>
        const supabaseClient = supabase.createClient(
            'https://ziyereoasqiqhjvedgit.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWVyZW9hc3FpcWhqdmVkZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3ODUsImV4cCI6MjA2NjE2Nzc4NX0.fnoWBmvKf8L7dFe3sHHOQKvoGINwHmWdMvgpeli8vuk'
        )
        
        async function testLogin() {
            console.log('🧪 Testing fresh OAuth setup...')
            
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'https://prismy.in/auth/callback'
                }
            })
            
            if (error) {
                document.getElementById('result').innerHTML = `❌ Error: ${error.message}`
                console.error(error)
            } else {
                console.log('✅ OAuth initiated successfully')
            }
        }
        
        // Handle callback
        const params = new URLSearchParams(window.location.search)
        if (params.get('code')) {
            document.getElementById('result').innerHTML = '✅ OAuth callback received!'
        }
    </script>
</body>
</html>
```

### 3.2. Deploy Test

```bash
# Copy to public folder
cp test-fresh-oauth.html public/

# Deploy
vercel --prod

# Update alias
vercel alias [new-deployment-url] prismy.in
```

---

## 🎯 PHASE 4: SYSTEMATIC TESTING

### Test Checklist (làm từng bước)

```
□ 1. Test page loads: https://prismy.in/test-fresh-oauth.html
□ 2. Click "Test Google Login" - should redirect to Google
□ 3. Select Google account - should redirect back
□ 4. Check for success message or errors
□ 5. Open DevTools Console - check for error messages
```

---

## 🚨 TROUBLESHOOTING FRESH SETUP

### Nếu vẫn lỗi ở bước cơ bản:

**A. Google Console Issues:**
```
- Kiểm tra OAuth app có status "Active"
- Verify authorized domains correct
- Ensure redirect URIs match exactly
```

**B. Supabase Issues:**
```
- Verify project not suspended
- Check API keys are correct
- Ensure Auth service enabled
```

**C. DNS/Network Issues:**
```
- Test từ different network/device
- Use VPN to test different locations
- Check if ISP blocking OAuth domains
```

---

## 💡 SUCCESS CRITERIA

**✅ OAuth Working = Khi fresh test page:**
1. Redirects to Google successfully
2. Allows account selection  
3. Redirects back to callback URL
4. Shows success message
5. No console errors

**❌ Still Failing = Infrastructure issue:**
- Google account restrictions
- Network/firewall blocking
- Domain/DNS issues
- Need different approach entirely

---

## 🎯 RESULT INTERPRETATION

**Sau khi test fresh setup:**

**✅ Nếu WORKS:** 
- Problem was config pollution
- Apply fresh config to main app
- OAuth will work immediately

**❌ Nếu STILL FAILS:**
- Not a config issue
- Infrastructure/network problem  
- Need alternative auth method
- Investigate Google account restrictions

---

Làm theo guide này **từng bước một** và report kết quả ở mỗi phase!