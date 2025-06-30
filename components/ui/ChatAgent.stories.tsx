import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { ChatAgent } from './ChatAgent'

const meta: Meta<typeof ChatAgent> = {
  title: 'UI/ChatAgent',
  component: ChatAgent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI-powered chat agent for translation assistance with context-aware responses, bilingual support, and comprehensive accessibility features.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['embedded', 'drawer'],
      description: 'Display variant - embedded inline or overlay drawer',
    },
    isOpen: {
      control: 'boolean',
      description: 'Controls drawer visibility (drawer variant only)',
    },
    title: {
      control: 'text',
      description: 'Chat window title',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder text',
    },
    contextData: {
      control: 'object',
      description: 'Translation context for AI responses',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ChatAgent>

// Mock context data for translation scenarios
const translationContext = {
  documentId: 'doc-123',
  translationText: 'Hello, how are you today?',
  sourceLanguage: 'en',
  targetLanguage: 'vi',
}

const documentContext = {
  documentId: 'legal-doc-456',
  translationText: 'This agreement shall be governed by the laws of Vietnam.',
  sourceLanguage: 'en',
  targetLanguage: 'vi',
}

export const Default: Story = {
  args: {
    title: 'AI Translation Assistant',
    placeholder: 'Ask me anything about your translation...',
  },
}

export const Embedded: Story = {
  args: {
    variant: 'embedded',
    title: 'AI Translation Assistant',
    placeholder: 'How can I help with your translation?',
    contextData: translationContext,
  },
  parameters: {
    docs: {
      description: {
        story: 'Embedded variant - integrates directly into the page layout.',
      },
    },
  },
}

export const Drawer: Story = {
  args: {
    variant: 'drawer',
    isOpen: true,
    title: 'AI Assistant',
    placeholder: 'Type your question here...',
    contextData: translationContext,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drawer variant - appears as an overlay sidebar for quick access.',
      },
    },
  },
}

export const TranslationAssistant: Story = {
  args: {
    title: 'Translation AI',
    placeholder: 'Ask about grammar, context, or alternative translations...',
    contextData: translationContext,
  },
  render: args => (
    <div className="h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-6 h-full">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Translation Workspace</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Source (English)
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded border">
                {args.contextData?.translationText}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Target (Vietnamese)
              </label>
              <div className="mt-1 p-3 bg-blue-50 rounded border">
                Xin chào, hôm nay bạn khỏe không?
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <ChatAgent {...args} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Real-world usage - AI assistant integrated with translation workspace.',
      },
    },
  },
}

export const DocumentTranslation: Story = {
  args: {
    title: 'Document AI Assistant',
    placeholder:
      'Ask about document structure, formatting, or translation accuracy...',
    contextData: documentContext,
  },
  render: args => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Legal Document Translation
          </h2>
          <p className="text-gray-600">
            AI-assisted translation with context awareness
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <span className="text-sm text-gray-500">
                Legal Contract - EN → VI
              </span>
            </div>
            <div className="prose max-w-none">
              <p className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded">
                {args.contextData?.translationText}
              </p>
              <p className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded mt-4">
                Thỏa thuận này sẽ được điều chỉnh bởi luật pháp Việt Nam.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <ChatAgent {...args} />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Document translation scenario - AI helps with complex legal text.',
      },
    },
  },
}

// Vietnamese/Bilingual Support
export const VietnameseAssistant: Story = {
  args: {
    title: 'Trợ lý AI Dịch thuật',
    placeholder: 'Hỏi tôi về ngữ pháp, ngữ cảnh hoặc các bản dịch thay thế...',
    contextData: {
      documentId: 'doc-vi-123',
      translationText: 'Xin chào, tôi cần giúp đỡ với bản dịch này.',
      sourceLanguage: 'vi',
      targetLanguage: 'en',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Vietnamese interface - fully localized chat assistant.',
      },
    },
  },
}

export const BilingualSupport: Story = {
  args: {
    title: 'AI Assistant / Trợ lý AI',
    placeholder:
      'Ask in English or Vietnamese / Hỏi bằng tiếng Anh hoặc tiếng Việt...',
    contextData: translationContext,
  },
  render: args => (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Bilingual AI Assistant</h2>
        <p className="text-gray-600">
          Supports both English and Vietnamese conversations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Sample Questions (English)</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              "What's the best way to translate this phrase?"
            </div>
            <div className="p-3 bg-blue-50 rounded">
              "Is this translation grammatically correct?"
            </div>
            <div className="p-3 bg-blue-50 rounded">
              "Can you suggest alternative translations?"
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Câu hỏi mẫu (Tiếng Việt)</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-green-50 rounded">
              "Cách tốt nhất để dịch cụm từ này là gì?"
            </div>
            <div className="p-3 bg-green-50 rounded">
              "Bản dịch này có đúng ngữ pháp không?"
            </div>
            <div className="p-3 bg-green-50 rounded">
              "Bạn có thể gợi ý các bản dịch khác không?"
            </div>
          </div>
        </div>
      </div>

      <ChatAgent {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Bilingual support - AI assistant that understands both English and Vietnamese.',
      },
    },
  },
}

export const AccessibilityDemo: Story = {
  args: {
    title: 'Accessible AI Assistant',
    placeholder: 'This chat is fully accessible with screen readers...',
  },
  render: args => (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Accessibility Features
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Screen reader support with ARIA live regions</li>
          <li>• Keyboard navigation with Tab and Enter</li>
          <li>• High contrast mode compatibility</li>
          <li>• Message announcements for new responses</li>
          <li>• Proper focus management and visual indicators</li>
          <li>• Alt text for all interactive elements</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Keyboard Shortcuts:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <kbd className="px-2 py-1 bg-gray-200 rounded">Tab</kbd> - Navigate
            elements
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> - Send
            message
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 rounded">Escape</kbd> - Close
            drawer
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+C</kbd> - Copy
            message
          </div>
        </div>
      </div>

      <ChatAgent {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility demonstration - WCAG AA compliant with full keyboard and screen reader support.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  args: {
    title: 'Interactive Chat Demo',
    placeholder: 'Try sending a message to see AI responses...',
    contextData: translationContext,
  },
  render: args => {
    const [drawerOpen, setDrawerOpen] = React.useState(false)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Translation Assistant
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Experience our AI-powered translation helper in different modes
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setDrawerOpen(true)}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Open Chat Drawer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Embedded Chat</h3>
              <ChatAgent {...args} variant="embedded" />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Translation Context
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700">
                    Current Translation
                  </h4>
                  <p className="text-sm mt-2">
                    {args.contextData?.translationText}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Source:</span>{' '}
                    {args.contextData?.sourceLanguage?.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">Target:</span>{' '}
                    {args.contextData?.targetLanguage?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer variant */}
          <ChatAgent
            variant="drawer"
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Chat Drawer"
            placeholder="Ask me anything..."
            contextData={args.contextData}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demonstration - try both embedded and drawer modes with live AI responses.',
      },
    },
  },
}

export const MobileOptimized: Story = {
  args: {
    title: 'Mobile Chat',
    placeholder: 'Optimized for mobile devices...',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized layout with touch-friendly interactions.',
      },
    },
  },
  render: args => (
    <div className="h-screen bg-gray-100 p-2">
      <div className="h-full bg-white rounded-lg shadow-sm">
        <ChatAgent {...args} />
      </div>
    </div>
  ),
}

export const Playground: Story = {
  args: {
    variant: 'embedded',
    title: 'AI Assistant',
    placeholder: 'Type your message here...',
    isOpen: true,
    contextData: translationContext,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Playground for testing different configurations and interactions.',
      },
    },
  },
}
