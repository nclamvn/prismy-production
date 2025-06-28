import { redirect } from 'next/navigation'

/**
 * ROOT PAGE - SERVER REDIRECT TO LANDING
 * Server-side redirect to avoid client-side bundle issues
 */
export default function HomePage() {
  redirect('/landing')
}
