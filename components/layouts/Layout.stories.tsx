import type { Meta, StoryObj } from '@storybook/nextjs'
import { MarketingLayout } from './MarketingLayout'
import { WorkspaceLayout } from './WorkspaceLayout'

// Marketing Layout Stories
const marketingMeta: Meta<typeof MarketingLayout> = {
  title: 'Layouts/MarketingLayout',
  component: MarketingLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Clean, minimal marketing layout inspired by NotebookML design patterns.',
      },
    },
  },
}

export default marketingMeta

type MarketingStory = StoryObj<typeof MarketingLayout>

export const Default: MarketingStory = {
  args: {
    children: (
      <div className="container-content py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Enterprise Document Processing
          </h1>
          <p className="text-lg text-secondary mb-8 max-w-2xl mx-auto">
            AI-powered document processing platform that handles
            enterprise-scale workloads with precision and speed.
          </p>
          <button className="bg-accent-brand text-white px-6 py-3 rounded-md hover:bg-accent-brand-hover transition-colors">
            Get Started
          </button>
        </div>
      </div>
    ),
  },
}

export const WithFeatures: MarketingStory = {
  args: {
    children: (
      <div className="container-content py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Why Choose Prismy?
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Built for enterprise teams who need reliable, scalable document
            processing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Lightning Fast"
            description="Process documents in seconds, not minutes"
            icon="⚡"
          />
          <FeatureCard
            title="Enterprise Security"
            description="SOC2 compliant with end-to-end encryption"
            icon="🔒"
          />
          <FeatureCard
            title="99.9% Accurate"
            description="Industry-leading accuracy for all document types"
            icon="🎯"
          />
        </div>
      </div>
    ),
  },
}

// Workspace Layout Stories - exported as separate story files would be better
type WorkspaceStory = StoryObj<typeof WorkspaceLayout>

export const WorkspaceDefault: WorkspaceStory = {
  args: {
    children: (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Document Processor
          </h1>
          <p className="text-secondary">Upload and process your documents</p>
        </div>

        <div className="bg-surface elevation-sm rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Drop files here
          </h3>
          <p className="text-muted">Supports PDF, DOCX, TXT, and more</p>
        </div>
      </div>
    ),
  },
}

export const WorkspaceWithChat: WorkspaceStory = {
  args: {
    children: (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Document Analysis
          </h1>
          <p className="text-secondary">AI-powered insights and translation</p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface elevation-sm rounded-lg p-4">
            <h3 className="font-semibold text-primary mb-2">
              Contract_2024.pdf
            </h3>
            <p className="text-secondary text-sm">Processed 2 minutes ago</p>
          </div>
          <div className="bg-surface elevation-sm rounded-lg p-4">
            <h3 className="font-semibold text-primary mb-2">
              Meeting_Notes.docx
            </h3>
            <p className="text-secondary text-sm">Processing...</p>
          </div>
        </div>
      </div>
    ),
    chatPanel: (
      <div className="p-4">
        <h3 className="font-semibold text-primary mb-4">AI Assistant</h3>
        <div className="space-y-3">
          <div className="bg-accent-brand-light p-3 rounded-md">
            <p className="text-sm">How can I help you with this document?</p>
          </div>
          <div className="bg-bg-muted p-3 rounded-md">
            <p className="text-sm">
              Summarize the key points in this contract.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Ask a question..."
            className="w-full px-3 py-2 border border-border-default rounded-md text-sm"
          />
        </div>
      </div>
    ),
  },
}

// Helper component for feature cards
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="bg-surface elevation-sm rounded-lg p-6 text-center">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-secondary text-sm">{description}</p>
    </div>
  )
}
