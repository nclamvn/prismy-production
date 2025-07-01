import { AuthLayout } from '@/components/layouts/AuthLayout'
import AuthModal from '@/components/auth/AuthModal'

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <AuthModal 
            isOpen={true}
            onClose={() => {}}
            initialMode="signin"
          />
        </div>
      </div>
    </AuthLayout>
  )
}