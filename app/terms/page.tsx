export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-default">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-secondary mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-secondary mb-4">
            By accessing and using Prismy, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">2. Use of Service</h2>
          <p className="text-secondary mb-4">
            Prismy provides AI-powered document processing services. You agree to use the service only for lawful purposes.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">3. Privacy</h2>
          <p className="text-secondary mb-4">
            Your use of our service is also governed by our Privacy Policy.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">4. Contact</h2>
          <p className="text-secondary">
            For questions about these terms, please contact us at support@prismy.in
          </p>
        </div>
      </div>
    </div>
  )
}