import type { Meta, StoryObj } from '@storybook/nextjs'
import { FileDropZone } from './FileDropZone'

const meta: Meta<typeof FileDropZone> = {
  title: 'UI/FileDropZone',
  component: FileDropZone,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Enterprise-grade file upload component with drag & drop, validation, and NotebookML-inspired design.',
      },
    },
  },
  argTypes: {
    maxFiles: {
      control: { type: 'number', min: 1, max: 20 },
    },
    maxSize: {
      control: { type: 'number' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof FileDropZone>

export const Default: Story = {
  args: {
    onFilesSelected: files => {
      console.log(
        'Files selected:',
        files.map(f => f.name)
      )
    },
  },
}

export const SingleFile: Story = {
  args: {
    maxFiles: 1,
    onFilesSelected: files => {
      console.log('File selected:', files[0]?.name)
    },
  },
}

export const PDFOnly: Story = {
  args: {
    accept: '.pdf',
    maxFiles: 5,
    onFilesSelected: files => {
      console.log(
        'PDF files selected:',
        files.map(f => f.name)
      )
    },
  },
}

export const LargeFiles: Story = {
  args: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 3,
    onFilesSelected: files => {
      console.log(
        'Large files selected:',
        files.map(f => f.name)
      )
    },
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    onFilesSelected: files => {
      console.log(
        'Files selected:',
        files.map(f => f.name)
      )
    },
  },
}

export const CustomContent: Story = {
  args: {
    onFilesSelected: files => {
      console.log(
        'Files selected:',
        files.map(f => f.name)
      )
    },
    children: (
      <div className="space-y-4">
        <div className="text-4xl">🚀</div>
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Upload Your Documents
          </h3>
          <p className="text-sm text-muted">
            Drag enterprise documents here for AI-powered processing
          </p>
        </div>
      </div>
    ),
  },
}

export const CompactVersion: Story = {
  args: {
    onFilesSelected: files => {
      console.log(
        'Files selected:',
        files.map(f => f.name)
      )
    },
    className: 'w-64',
    children: (
      <div className="space-y-2">
        <div className="text-2xl">📎</div>
        <p className="text-sm text-primary font-medium">
          Drop files or click to browse
        </p>
      </div>
    ),
  },
}

export const WithFormContext: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary">
          Document Upload
        </label>
        <p className="text-xs text-muted">
          Upload documents for AI processing and translation
        </p>
      </div>

      <FileDropZone
        onFilesSelected={files => {
          console.log(
            'Files selected:',
            files.map(f => f.name)
          )
        }}
        accept=".pdf,.docx,.txt"
        maxFiles={5}
        maxSize={25 * 1024 * 1024} // 25MB
      />

      <div className="text-xs text-muted">
        Supported formats: PDF, DOCX, TXT • Maximum 5 files • 25MB per file
      </div>
    </div>
  ),
}
