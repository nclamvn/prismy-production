import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { WorkspaceLayout } from './WorkspaceLayout'
import { FileText, Settings, HelpCircle, MessageSquare } from 'lucide-react'

const meta: Meta<typeof WorkspaceLayout> = {
  title: 'Layouts/WorkspaceLayout',
  component: WorkspaceLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Flexible workspace layout with collapsible sidebar, optional right panel, and integrated chat drawer for translation workflows.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Main workspace content',
    },
    sidebar: {
      control: false,
      description: 'Optional sidebar content',
    },
    rightPanel: {
      control: false,
      description: 'Optional right panel content',
    },
    showChatDrawer: {
      control: 'boolean',
      description: 'Show/hide chat drawer overlay',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof WorkspaceLayout>

// Sample content components
const SampleSidebar = () => (
  <nav className="p-4 space-y-2">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">Navigation</h3>
    <div className="space-y-1">
      <a
        href="#"
        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <FileText className="h-4 w-4" />
        Documents
      </a>
      <a
        href="#"
        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <MessageSquare className="h-4 w-4" />
        Translations
      </a>
      <a
        href="#"
        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <Settings className="h-4 w-4" />
        Settings
      </a>
      <a
        href="#"
        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </a>
    </div>
  </nav>
)

const SampleRightPanel = () => (
  <div className="p-4 bg-gray-50 h-full">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">
      Translation Info
    </h3>
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Source
        </h4>
        <p className="text-sm text-gray-900 mt-1">English (EN)</p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Target
        </h4>
        <p className="text-sm text-gray-900 mt-1">Vietnamese (VI)</p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Progress
        </h4>
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: '75%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">75% completed</p>
        </div>
      </div>
    </div>
  </div>
)

const SampleMainContent = ({
  title = 'Translation Workspace',
}: {
  title?: string
}) => (
  <div className="p-6 h-full">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Text (English)
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter text to translate..."
              defaultValue="Welcome to our AI-powered translation platform. We provide accurate, context-aware translations for businesses and individuals worldwide."
            />
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Translate
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Translation (Vietnamese)
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none bg-gray-50"
              readOnly
              value="Chào mừng bạn đến với nền tảng dịch thuật được hỗ trợ bởi AI của chúng tôi. Chúng tôi cung cấp các bản dịch chính xác, nhận biết ngữ cảnh cho các doanh nghiệp và cá nhân trên toàn thế giới."
            />
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Copy
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Translation Tips
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use the AI chat assistant for context-specific help</li>
          <li>• Check the right panel for translation progress</li>
          <li>• Save frequently used translations to favorites</li>
        </ul>
      </div>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: <SampleMainContent />,
  },
}

export const WithSidebar: Story = {
  args: {
    children: <SampleMainContent />,
    sidebar: <SampleSidebar />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Workspace with custom sidebar navigation - collapsible with toggle button.',
      },
    },
  },
}

export const WithRightPanel: Story = {
  args: {
    children: <SampleMainContent />,
    sidebar: <SampleSidebar />,
    rightPanel: <SampleRightPanel />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full layout with sidebar and right panel for additional context information.',
      },
    },
  },
}

export const WithChatDrawer: Story = {
  args: {
    children: <SampleMainContent />,
    sidebar: <SampleSidebar />,
    showChatDrawer: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Workspace with chat drawer overlay for AI assistant interactions.',
      },
    },
  },
}

export const TranslationWorkflow: Story = {
  args: {
    children: <SampleMainContent title="Document Translation" />,
    sidebar: <SampleSidebar />,
    rightPanel: <SampleRightPanel />,
    showChatDrawer: false,
  },
  render: args => {
    const [chatOpen, setChatOpen] = React.useState(false)

    return (
      <WorkspaceLayout
        {...args}
        showChatDrawer={chatOpen}
        onToggleChatDrawer={() => setChatOpen(!chatOpen)}
      >
        {args.children}
      </WorkspaceLayout>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete translation workflow with interactive chat drawer toggle.',
      },
    },
  },
}

export const VietnameseWorkspace: Story = {
  args: {
    children: <SampleMainContent title="Không gian làm việc dịch thuật" />,
    sidebar: (
      <nav className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Điều hướng</h3>
        <div className="space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <FileText className="h-4 w-4" />
            Tài liệu
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <MessageSquare className="h-4 w-4" />
            Bản dịch
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Settings className="h-4 w-4" />
            Cài đặt
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <HelpCircle className="h-4 w-4" />
            Trợ giúp
          </a>
        </div>
      </nav>
    ),
    rightPanel: (
      <div className="p-4 bg-gray-50 h-full">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Thông tin dịch thuật
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Nguồn
            </h4>
            <p className="text-sm text-gray-900 mt-1">Tiếng Anh (EN)</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Đích
            </h4>
            <p className="text-sm text-gray-900 mt-1">Tiếng Việt (VI)</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tiến độ
            </h4>
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '85%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">85% hoàn thành</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Vietnamese localized workspace with translated navigation and content.',
      },
    },
  },
}

export const DocumentProcessing: Story = {
  args: {
    children: (
      <div className="p-6 h-full">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Document Processing
          </h1>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Document
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your file here or click to browse
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Browse Files
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Processing Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Text Extraction</span>
                    <span className="text-sm text-green-600">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language Detection</span>
                    <span className="text-sm text-green-600">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Translation</span>
                    <span className="text-sm text-blue-600">
                      🔄 In Progress
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Format Preservation</span>
                    <span className="text-sm text-gray-400">⏳ Pending</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Document Preview</h3>
              <div className="bg-gray-50 h-64 rounded border flex items-center justify-center">
                <p className="text-gray-500">Preview will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    sidebar: <SampleSidebar />,
    rightPanel: <SampleRightPanel />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Document processing workflow with upload, status tracking, and preview.',
      },
    },
  },
}

export const MobileOptimized: Story = {
  args: {
    children: <SampleMainContent />,
    sidebar: <SampleSidebar />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized layout with collapsible sidebar and touch-friendly interactions.',
      },
    },
  },
}

export const AccessibilityDemo: Story = {
  args: {
    children: (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Accessibility Features
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Keyboard Navigation
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <kbd className="px-2 py-1 bg-blue-100 rounded">Ctrl + \</kbd>{' '}
                - Toggle sidebar
              </li>
              <li>
                • <kbd className="px-2 py-1 bg-blue-100 rounded">Ctrl + M</kbd>{' '}
                - Toggle chat
              </li>
              <li>
                • <kbd className="px-2 py-1 bg-blue-100 rounded">Tab</kbd> -
                Navigate elements
              </li>
              <li>
                • <kbd className="px-2 py-1 bg-blue-100 rounded">Escape</kbd> -
                Close drawers
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Screen Reader Support
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ARIA landmarks for main regions</li>
              <li>• Skip links for quick navigation</li>
              <li>• Live regions for status updates</li>
              <li>• Descriptive labels and roles</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              Visual Accessibility
            </h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• High contrast color scheme</li>
              <li>• Focus indicators for all interactive elements</li>
              <li>• Responsive text sizing</li>
              <li>• Reduced motion support</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    sidebar: <SampleSidebar />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility features demonstration - WCAG AA compliant with full keyboard and screen reader support.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  render: () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true)
    const [chatOpen, setChatOpen] = React.useState(false)
    const [rightPanelVisible, setRightPanelVisible] = React.useState(true)

    return (
      <div className="h-screen">
        <div className="bg-gray-100 p-4 border-b">
          <div className="flex gap-4 items-center">
            <h2 className="text-lg font-semibold">Interactive Layout Demo</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Toggle Sidebar
              </button>
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Toggle Chat
              </button>
              <button
                onClick={() => setRightPanelVisible(!rightPanelVisible)}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Toggle Panel
              </button>
            </div>
          </div>
        </div>

        <WorkspaceLayout
          sidebar={sidebarOpen ? <SampleSidebar /> : undefined}
          rightPanel={rightPanelVisible ? <SampleRightPanel /> : undefined}
          showChatDrawer={chatOpen}
          onToggleChatDrawer={() => setChatOpen(!chatOpen)}
        >
          <SampleMainContent title="Interactive Workspace" />
        </WorkspaceLayout>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - toggle different layout components to see responsive behavior.',
      },
    },
  },
}

export const Playground: Story = {
  args: {
    children: <SampleMainContent />,
    sidebar: <SampleSidebar />,
    rightPanel: <SampleRightPanel />,
    showChatDrawer: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground for testing different workspace configurations.',
      },
    },
  },
}
