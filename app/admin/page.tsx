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
    // Enhanced error handling for non-admin users
    const currentRole = userData?.role || 'unknown'
    
    console.log(`Admin access denied. User ID: ${user.id}, Current role: ${currentRole}`)
    
    // For development, provide helpful information
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
              <p className="text-gray-600 mb-4">
                You need admin privileges to access this page.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Development Info:</h3>
                <p className="text-sm text-yellow-700">
                  <strong>User ID:</strong> {user.id}<br/>
                  <strong>Current Role:</strong> {currentRole}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">To grant admin access:</h3>
                <p className="text-sm text-blue-700 text-left">
                  1. Go to Supabase Dashboard<br/>
                  2. Navigate to Table Editor → users<br/>
                  3. Find your user ID: <code className="bg-gray-100 px-1">{user.id}</code><br/>
                  4. Update the 'role' column to 'admin'
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    redirect('/')
  }
  
  return <AdminDashboard />
}