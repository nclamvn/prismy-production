'use client'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileDropZone } from '@/components/ui/FileDropZone'
import { MarketingLayout } from '@/components/layouts/MarketingLayout'

export default function DemoPage() {
  const handleFilesSelected = (files: File[]) => {
    console.log(
      'Files selected:',
      files.map(f => f.name)
    )
  }

  return (
    <MarketingLayout>
      <div className="container-content py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-primary">Component Demo</h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Testing our NotebookML-inspired atomic design system in production
            </p>
          </div>

          {/* Button Showcase */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">Buttons</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button>Get Started</Button>
                <Button variant="secondary">Cancel</Button>
                <Button variant="outline">Learn More</Button>
                <Button variant="ghost">Skip</Button>
                <Button variant="link">Documentation</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">⚙️</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
              </div>
            </div>
          </section>

          {/* Input Showcase */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">Inputs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Document Title
                </label>
                <Input placeholder="Enter document title..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Email Address
                </label>
                <Input type="email" placeholder="Enter your email..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Search Documents
                </label>
                <Input type="search" placeholder="Search your documents..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Disabled Field
                </label>
                <Input disabled value="Cannot edit this field" />
              </div>
            </div>
          </section>

          {/* FileDropZone Showcase */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">File Upload</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Default FileDropZone */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  Default Upload
                </h3>
                <FileDropZone onFilesSelected={handleFilesSelected} />
              </div>

              {/* Single File Upload */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  Single File Upload
                </h3>
                <FileDropZone
                  maxFiles={1}
                  onFilesSelected={handleFilesSelected}
                />
              </div>

              {/* PDF Only Upload */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">PDF Only</h3>
                <FileDropZone
                  accept=".pdf"
                  maxFiles={3}
                  onFilesSelected={handleFilesSelected}
                />
              </div>

              {/* Custom Content Upload */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  Custom Content
                </h3>
                <FileDropZone onFilesSelected={handleFilesSelected}>
                  <div className="space-y-4">
                    <div className="text-4xl">🚀</div>
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-2">
                        Enterprise Upload
                      </h4>
                      <p className="text-sm text-muted">
                        Drag enterprise documents for AI processing
                      </p>
                    </div>
                  </div>
                </FileDropZone>
              </div>
            </div>
          </section>

          {/* Form Example */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">
              Complete Form
            </h2>
            <div className="bg-surface elevation-md rounded-lg p-8 max-w-2xl">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      First Name
                    </label>
                    <Input placeholder="Enter your first name..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Last Name
                    </label>
                    <Input placeholder="Enter your last name..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">
                    Company Email
                  </label>
                  <Input type="email" placeholder="Enter your work email..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">
                    Upload Documents
                  </label>
                  <FileDropZone
                    accept=".pdf,.docx,.txt"
                    maxFiles={5}
                    maxSize={25 * 1024 * 1024} // 25MB
                    onFilesSelected={handleFilesSelected}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" size="lg">
                    Submit Application
                  </Button>
                  <Button variant="outline" size="lg">
                    Save Draft
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* Design Token Showcase */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">
              Design Tokens
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-default p-4 rounded-lg border border-border-default">
                <div className="text-sm font-medium text-primary mb-2">
                  Background Default
                </div>
                <div className="text-xs text-muted">bg-default (#FAFAFA)</div>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border-default">
                <div className="text-sm font-medium text-primary mb-2">
                  Background Surface
                </div>
                <div className="text-xs text-muted">bg-surface (#FFFFFF)</div>
              </div>
              <div className="bg-bg-muted p-4 rounded-lg border border-border-default">
                <div className="text-sm font-medium text-primary mb-2">
                  Background Muted
                </div>
                <div className="text-xs text-muted">bg-muted (#F5F5F5)</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-accent-brand p-4 rounded-lg">
                <div className="text-sm font-medium text-white mb-2">
                  Brand Accent
                </div>
                <div className="text-xs text-white/80">
                  accent-brand (#4F46E5)
                </div>
              </div>
              <div className="bg-accent-brand-light p-4 rounded-lg border border-border-default">
                <div className="text-sm font-medium text-accent-brand mb-2">
                  Brand Light
                </div>
                <div className="text-xs text-muted">
                  accent-brand-light (#EEF2FF)
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
