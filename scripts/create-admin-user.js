#!/usr/bin/env node

/**
 * PRISMY ADMIN USER CREATOR
 * Tạo admin user từ auth user hiện tại
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser(emailParam) {
  console.log('🚀 TẠO ADMIN USER...\n')

  try {
    // Lấy tất cả auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Lỗi lấy auth users:', authError.message)
      return
    }

    console.log(`✅ Tìm thấy ${authUsers?.users?.length || 0} auth users`)

    let targetUser = null

    if (emailParam) {
      // Tìm user theo email
      targetUser = authUsers.users.find(u => u.email === emailParam)
      if (!targetUser) {
        console.error(`❌ Không tìm thấy user với email: ${emailParam}`)
        console.log('📝 Available users:')
        authUsers.users.forEach(u => console.log(`   - ${u.email}`))
        return
      }
    } else {
      // Tự động chọn user nclamvn@gmail.com (main user)
      targetUser = authUsers.users.find(u => u.email === 'nclamvn@gmail.com')
      if (!targetUser) {
        // Fallback: chọn user đầu tiên
        targetUser = authUsers.users[0]
      }
    }

    if (!targetUser) {
      console.error('❌ Không có user nào để tạo admin')
      return
    }

    console.log(`🎯 Sẽ tạo admin cho user: ${targetUser.email} (ID: ${targetUser.id})`)

    // 1. Kiểm tra user đã tồn tại trong users table chưa
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUser.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Lỗi kiểm tra user:', checkError.message)
      return
    }

    if (existingUser) {
      console.log('📝 User đã tồn tại trong users table')
      
      // Update role thành admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Lỗi update role:', updateError.message)
        return
      }

      console.log('✅ Đã update user thành admin!')
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Role: ${updatedUser.role}`)
      
    } else {
      console.log('📝 User chưa có trong users table, sẽ tạo mới')
      
      // Tạo user mới với admin role
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: targetUser.id,
          email: targetUser.email,
          role: 'admin',
          trial_credits: 50000, // Cho admin nhiều credits
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Lỗi tạo user:', createError.message)
        return
      }

      console.log('✅ Đã tạo admin user mới!')
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Role: ${newUser.role}`)
      console.log(`   Credits: ${newUser.trial_credits}`)
    }

    // 2. Kiểm tra và update user_profiles nếu cần
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Lỗi kiểm tra profile:', profileError.message)
    } else if (profile) {
      console.log('✅ User_profiles đã tồn tại')
      console.log(`   Subscription tier: ${profile.subscription_tier}`)
      
      // Đảm bảo subscription_tier là enterprise cho admin
      if (profile.subscription_tier !== 'enterprise') {
        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'enterprise' })
          .eq('user_id', targetUser.id)

        if (updateProfileError) {
          console.warn('⚠️ Không thể update subscription_tier:', updateProfileError.message)
        } else {
          console.log('✅ Đã update subscription_tier thành enterprise')
        }
      }
    } else {
      console.log('📝 Tạo user_profiles cho admin...')
      
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: targetUser.id,
          full_name: targetUser.user_metadata?.full_name || 'Admin User',
          subscription_tier: 'enterprise',
          usage_limit: 1000000,
          usage_count: 0,
          usage_reset_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createProfileError) {
        console.warn('⚠️ Không thể tạo profile:', createProfileError.message)
      } else {
        console.log('✅ Đã tạo user_profiles cho admin')
      }
    }

    // 3. Test admin access
    console.log('\n🧪 TEST ADMIN ACCESS...')
    
    const { data: testAdmin, error: testError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin')

    if (testError) {
      console.error('❌ Lỗi test admin:', testError.message)
    } else {
      console.log(`✅ Tìm thấy ${testAdmin?.length || 0} admin users:`)
      testAdmin?.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.id})`)
      })
    }

    console.log('\n🎉 HOÀN THÀNH!')
    console.log('📋 Bước tiếp theo:')
    console.log('   1. Đăng nhập với email:', targetUser.email)
    console.log('   2. Truy cập admin panel: /admin')
    console.log('   3. Kiểm tra admin dashboard hoạt động')

  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error)
  }
}

// Lấy email từ command line argument hoặc dùng default
const email = process.argv[2]

if (require.main === module) {
  createAdminUser(email)
}

module.exports = { createAdminUser }