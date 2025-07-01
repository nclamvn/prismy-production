export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-default">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-secondary mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-secondary mb-4">
            We collect information you provide directly to us, such as when you create an account or upload documents.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-secondary mb-4">
            We use your information to provide, maintain, and improve our services, including document processing and translation.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">3. Data Security</h2>
          <p className="text-secondary mb-4">
            We implement appropriate technical and organizational measures to protect your data.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">4. Contact Us</h2>
          <p className="text-secondary">
            If you have questions about this Privacy Policy, please contact us at privacy@prismy.in
          </p>
        </div>
      </div>
    </div>
  )
}