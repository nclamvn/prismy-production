import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { FileUpload } from '@/components/upload/file-upload'

export default async function UploadPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
          <p className="text-muted-foreground">
            Upload your documents for translation. We support PDF, DOCX, DOC, TXT, and MD files up to 1GB.
          </p>
        </div>

        <FileUpload />
      </div>
    </AppLayout>
  )
}