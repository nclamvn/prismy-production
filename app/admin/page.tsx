import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }
  
  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (userError || userData?.role !== 'admin') {
    redirect('/')
  }
  
  return <AdminDashboard />
}