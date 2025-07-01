import { redirect } from 'next/navigation'

export default function LocalizedDocumentsPage({
  params,
}: {
  params: { locale: string }
}) {
  // Redirect to main documents page
  redirect('/documents')
}