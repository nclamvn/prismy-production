#!/usr/bin/env node

/**
 * PRISMY ADMIN STATUS CHECKER
 * Kiểm tra user hiện tại có admin role không và database setup
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu environment variables.')
  console.error('Cần: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkAdminStatus() {
  console.log('🔍 KIỂM TRA ADMIN STATUS...\n')

  try {
    // 1. Kiểm tra users table structure
    console.log('1️⃣ Kiểm tra users table structure...')
    const { data: usersTableInfo, error: tableError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
      }
    )

    if (tableError) {
      console.error('❌ Lỗi kiểm tra users table:', tableError.message)
    } else {
      console.log('✅ Users table structure:')
      if (usersTableInfo && usersTableInfo.length > 0) {
        usersTableInfo.forEach(col => {
          console.log(
            `   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
          )
        })
      } else {
        console.log('   ⚠️ Users table không tồn tại hoặc không có columns')
      }
    }

    // 2. Kiểm tra user_profiles table structure
    console.log('\n2️⃣ Kiểm tra user_profiles table structure...')
    const { data: profilesTableInfo, error: profilesError } =
      await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'user_profiles' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
      })

    if (profilesError) {
      console.error(
        '❌ Lỗi kiểm tra user_profiles table:',
        profilesError.message
      )
    } else {
      console.log('✅ User_profiles table structure:')
      if (profilesTableInfo && profilesTableInfo.length > 0) {
        profilesTableInfo.forEach(col => {
          console.log(
            `   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
          )
        })
      } else {
        console.log(
          '   ⚠️ User_profiles table không tồn tại hoặc không có columns'
        )
      }
    }

    // 3. Liệt kê tất cả users hiện tại
    console.log('\n3️⃣ Liệt kê tất cả users...')
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, trial_credits, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Lỗi lấy danh sách users:', usersError.message)
    } else {
      console.log(`✅ Tìm thấy ${allUsers?.length || 0} users:`)
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email}`)
          console.log(`      ID: ${user.id}`)
          console.log(`      Role: ${user.role || 'NULL'}`)
          console.log(`      Trial Credits: ${user.trial_credits || 0}`)
          console.log(`      Created: ${user.created_at}`)
          console.log('')
        })
      } else {
        console.log('   📝 Chưa có users nào trong database')
      }
    }

    // 4. Kiểm tra admin users
    console.log('4️⃣ Kiểm tra admin users...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Lỗi kiểm tra admin users:', adminError.message)
    } else {
      console.log(`✅ Tìm thấy ${adminUsers?.length || 0} admin users:`)
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach((admin, index) => {
          console.log(`   ${index + 1}. ${admin.email} (ID: ${admin.id})`)
        })
      } else {
        console.log('   ⚠️ KHÔNG CÓ ADMIN USER NÀO!')
        console.log('   💡 Cần tạo admin user để truy cập admin panel')
      }
    }

    // 5. Kiểm tra user_profiles có enterprise users không
    console.log('\n5️⃣ Kiểm tra enterprise users trong user_profiles...')
    const { data: enterpriseUsers, error: enterpriseError } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, subscription_tier')
      .eq('subscription_tier', 'enterprise')

    if (enterpriseError) {
      console.error(
        '❌ Lỗi kiểm tra enterprise users:',
        enterpriseError.message
      )
    } else {
      console.log(
        `✅ Tìm thấy ${enterpriseUsers?.length || 0} enterprise users:`
      )
      if (enterpriseUsers && enterpriseUsers.length > 0) {
        enterpriseUsers.forEach((user, index) => {
          console.log(
            `   ${index + 1}. ${user.full_name || 'No name'} (User ID: ${user.user_id})`
          )
        })
      } else {
        console.log('   📝 Chưa có enterprise users nào')
      }
    }

    // 6. Kiểm tra auth.users table
    console.log('\n6️⃣ Kiểm tra Supabase auth users...')
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Lỗi lấy auth users:', authError.message)
    } else {
      console.log(`✅ Tìm thấy ${authUsers?.users?.length || 0} auth users:`)
      if (authUsers?.users && authUsers.users.length > 0) {
        authUsers.users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email}`)
          console.log(`      ID: ${user.id}`)
          console.log(`      Created: ${user.created_at}`)
          console.log(`      Last sign in: ${user.last_sign_in_at || 'Never'}`)
          console.log('')
        })
      } else {
        console.log('   📝 Chưa có auth users nào')
      }
    }

    // 7. Recommendations
    console.log('\n📋 KHUYẾN NGHỊ:')

    if (!adminUsers || adminUsers.length === 0) {
      console.log('🔧 Cần tạo admin user:')
      console.log('   1. Chạy: node scripts/create-admin-user.js <email>')
      console.log('   2. Hoặc thêm thủ công vào database')
      console.log('   3. Hoặc set ADMIN_EMAILS trong .env')
    } else {
      console.log('✅ Đã có admin user, kiểm tra admin panel access')
    }

    console.log('\n🎯 NEXT STEPS:')
    console.log('   1. Nếu không có admin → Tạo admin user')
    console.log('   2. Test admin panel tại /admin')
    console.log('   3. Kiểm tra pipeline output issues')
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error)
  }
}

if (require.main === module) {
  checkAdminStatus()
}

module.exports = { checkAdminStatus }
