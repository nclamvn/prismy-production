import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProgressIndicator, ProgressStep } from './ProgressIndicator'

const meta: Meta<typeof ProgressIndicator> = {
  title: 'UI/ProgressIndicator',
  component: ProgressIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Master Prompt compliant progress indicator with real-time updates, bilingual support, and comprehensive accessibility features.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Layout orientation of progress steps',
    },
    showProgress: {
      control: 'boolean',
      description: 'Show/hide progress bars for active steps',
    },
    currentStep: {
      control: 'text',
      description: 'ID of currently highlighted step',
    },
    steps: {
      control: 'object',
      description: 'Array of progress steps with status and progress data',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ProgressIndicator>

// Sample progress data
const sampleSteps: ProgressStep[] = [
  {
    id: 'upload',
    label: 'Upload Document',
    description: 'Uploading your file to the server',
    status: 'completed',
    progress: 100,
  },
  {
    id: 'process',
    label: 'Processing',
    description: 'Analyzing document content and structure',
    status: 'processing',
    progress: 65,
  },
  {
    id: 'translate',
    label: 'Translation',
    description: 'Translating text to target language',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Translation finished successfully',
    status: 'pending',
    progress: 0,
  },
]

export const Default: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 'process',
    showProgress: true,
  },
}

export const Vertical: Story = {
  args: {
    steps: sampleSteps,
    variant: 'vertical',
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Vertical layout (default) - ideal for sidebars and detailed step descriptions.',
      },
    },
  },
}

export const Horizontal: Story = {
  args: {
    steps: sampleSteps,
    variant: 'horizontal',
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Horizontal layout - perfect for top navigation and compact displays.',
      },
    },
  },
}

export const WithoutProgressBars: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 'process',
    showProgress: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clean view without progress bars - shows only status icons and labels.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    steps: [
      {
        id: 'upload',
        label: 'Upload Document',
        description: 'File uploaded successfully',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'process',
        label: 'Processing',
        description: 'Document analysis completed',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'translate',
        label: 'Translation',
        description: 'Failed to translate document - unsupported format',
        status: 'error',
        progress: 0,
      },
      {
        id: 'complete',
        label: 'Complete',
        description: 'Process stopped due to error',
        status: 'pending',
        progress: 0,
      },
    ],
    currentStep: 'translate',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error handling - shows error status with appropriate styling and messaging.',
      },
    },
  },
}

export const AllCompleted: Story = {
  args: {
    steps: sampleSteps.map(step => ({
      ...step,
      status: 'completed' as const,
      progress: 100,
    })),
    currentStep: 'complete',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Success state - all steps completed successfully.',
      },
    },
  },
}

export const DocumentTranslation: Story = {
  args: {
    steps: [
      {
        id: 'upload',
        label: 'Document Upload',
        description: 'PDF file uploaded (2.3 MB)',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'ocr',
        label: 'Text Extraction',
        description: 'Extracting text using OCR technology',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'analysis',
        label: 'Content Analysis',
        description: 'Analyzing structure and formatting',
        status: 'processing',
        progress: 78,
      },
      {
        id: 'translate',
        label: 'AI Translation',
        description: 'Translating English → Vietnamese',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'format',
        label: 'Format Preservation',
        description: 'Maintaining original layout and styling',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'download',
        label: 'Download Ready',
        description: 'Translated document ready for download',
        status: 'pending',
        progress: 0,
      },
    ],
    currentStep: 'analysis',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example - document translation workflow with detailed steps.',
      },
    },
  },
}

// Vietnamese/Bilingual Support
export const VietnameseSteps: Story = {
  args: {
    steps: [
      {
        id: 'upload',
        label: 'Tải lên tài liệu',
        description: 'Đang tải tệp của bạn lên máy chủ',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'process',
        label: 'Xử lý dữ liệu',
        description: 'Phân tích nội dung và cấu trúc tài liệu',
        status: 'processing',
        progress: 42,
      },
      {
        id: 'translate',
        label: 'Dịch thuật',
        description: 'Dịch văn bản sang ngôn ngữ đích',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'complete',
        label: 'Hoàn thành',
        description: 'Quá trình dịch thuật đã hoàn tất',
        status: 'pending',
        progress: 0,
      },
    ],
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Vietnamese language support - fully localized step labels and descriptions.',
      },
    },
  },
}

export const BilingualSteps: Story = {
  args: {
    steps: [
      {
        id: 'upload',
        label: 'Upload / Tải lên',
        description: 'Uploading file to server / Đang tải tệp lên máy chủ',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'process',
        label: 'Processing / Xử lý',
        description: 'Analyzing content / Phân tích nội dung',
        status: 'processing',
        progress: 55,
      },
      {
        id: 'translate',
        label: 'Translation / Dịch thuật',
        description: 'AI translation in progress / Đang dịch bằng AI',
        status: 'pending',
        progress: 0,
      },
    ],
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bilingual display - English and Vietnamese labels for international users.',
      },
    },
  },
}

export const MinimalSteps: Story = {
  args: {
    steps: [
      {
        id: 'start',
        label: 'Start',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'process',
        label: 'Process',
        status: 'processing',
        progress: 30,
      },
      {
        id: 'finish',
        label: 'Finish',
        status: 'pending',
        progress: 0,
      },
    ],
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal configuration - steps without descriptions for compact layouts.',
      },
    },
  },
}

export const LongWorkflow: Story = {
  args: {
    steps: [
      { id: '1', label: 'Initialize', status: 'completed', progress: 100 },
      { id: '2', label: 'Validate', status: 'completed', progress: 100 },
      { id: '3', label: 'Parse', status: 'completed', progress: 100 },
      { id: '4', label: 'Process', status: 'processing', progress: 25 },
      { id: '5', label: 'Transform', status: 'pending', progress: 0 },
      { id: '6', label: 'Validate Output', status: 'pending', progress: 0 },
      { id: '7', label: 'Package', status: 'pending', progress: 0 },
      { id: '8', label: 'Deploy', status: 'pending', progress: 0 },
    ],
    variant: 'horizontal',
    currentStep: '4',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complex workflow - many steps in horizontal layout for process monitoring.',
      },
    },
  },
}

export const AccessibilityDemo: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 'process',
    showProgress: true,
  },
  render: args => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        This component includes comprehensive accessibility features:
      </div>
      <ul className="text-xs text-gray-500 space-y-1">
        <li>• ARIA labels and roles for screen readers</li>
        <li>• Proper color contrast ratios</li>
        <li>• Keyboard navigation support</li>
        <li>• Status announcements for updates</li>
        <li>• Progress bar semantics</li>
      </ul>
      <ProgressIndicator {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility features demonstration - WCAG AA compliant with screen reader support.',
      },
    },
  },
}

export const Interactive: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 'process',
    showProgress: true,
  },
  render: args => {
    const [currentProgress, setCurrentProgress] = React.useState(65)
    const [currentStepId, setCurrentStepId] = React.useState('process')

    const updateProgress = () => {
      if (currentProgress < 100) {
        setCurrentProgress(prev => Math.min(prev + 10, 100))
      } else if (currentStepId === 'process') {
        setCurrentStepId('translate')
        setCurrentProgress(0)
      }
    }

    const updatedSteps = args.steps.map(step =>
      step.id === currentStepId
        ? {
            ...step,
            progress: currentProgress,
            status: currentProgress === 100 ? 'completed' : 'processing',
          }
        : step.id === 'upload'
          ? { ...step, status: 'completed', progress: 100 }
          : step
    )

    return (
      <div className="space-y-4">
        <button
          onClick={updateProgress}
          className="px-4 py-2 bg-accent text-white rounded-button hover:bg-accent/90"
        >
          Simulate Progress Update
        </button>
        <ProgressIndicator
          {...args}
          steps={updatedSteps}
          currentStep={currentStepId}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - click button to simulate real-time progress updates.',
      },
    },
  },
}

// Playground story for testing
export const Playground: Story = {
  args: {
    steps: sampleSteps,
    variant: 'vertical',
    currentStep: 'process',
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Playground for testing different configurations and step combinations.',
      },
    },
  },
}
