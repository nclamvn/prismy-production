# Deployment Checklist - Prismy MVP

## ✅ Đã hoàn thành
- [x] Code invite + credit system 
- [x] Database schema và migrations
- [x] API endpoints (admin + user)
- [x] UI components (redemption + dashboard)
- [x] Integration với translation APIs
- [x] Deploy lên Vercel production

## 📋 Cần làm ngay

### 1. Database Setup (15 phút)
- [ ] Login Supabase Dashboard
- [ ] Chạy migration script trong SQL Editor
- [ ] Verify 3 tables được tạo thành công
- [ ] Test các SQL functions

### 2. Environment Config (5 phút)
- [ ] Add INVITE_SALT vào Vercel env vars
- [ ] Redeploy để apply changes
- [ ] Verify deployment success

### 3. Admin Setup (10 phút)  
- [ ] Get user_id từ auth.users table
- [ ] Update subscription_tier = 'enterprise'
- [ ] Add 10,000 credits cho admin account
- [ ] Test login với quyền admin

### 4. Generate Invite Codes (10 phút)
- [ ] Chạy script tạo 10 invite codes
- [ ] Copy và lưu codes vào spreadsheet
- [ ] Tạo email template cho beta testers
- [ ] Chuẩn bị onboarding guide

### 5. Testing (30 phút)
- [ ] Test invite redemption flow
- [ ] Test credit deduction khi dịch
- [ ] Test admin dashboard
- [ ] Test error cases

### 6. Launch Beta (1 giờ)
- [ ] Gửi invite codes cho 10 testers
- [ ] Setup monitoring dashboard
- [ ] Tạo feedback form
- [ ] Schedule check-in meetings

## 📞 Support Contact
- Technical issues: dev@prismy.in
- Feedback: feedback@prismy.in
- Emergency: +84...