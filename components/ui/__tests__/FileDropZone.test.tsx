import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileDropZone } from '../FileDropZone'

// Mock file creation helper
const createMockFile = (
  name: string,
  size: number,
  type: string = 'application/pdf'
) => {
  const file = new File(['content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileDropZone', () => {
  const mockOnFilesSelected = jest.fn()

  beforeEach(() => {
    mockOnFilesSelected.mockClear()
  })

  it('renders with default content', () => {
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    expect(
      screen.getByText('Drop files here or click to browse')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Supports PDF, DOCX, TXT, DOC files/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Maximum 10 files/)).toBeInTheDocument()
  })

  it('renders custom children', () => {
    render(
      <FileDropZone onFilesSelected={mockOnFilesSelected}>
        <div>Custom content</div>
      </FileDropZone>
    )

    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('handles file selection via input', async () => {
    const user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024)
    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(mockOnFilesSelected).toHaveBeenCalledWith([file])
  })

  it('validates file count limit', async () => {
    const user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxFiles={2} />)

    const files = [
      createMockFile('test1.pdf', 1024),
      createMockFile('test2.pdf', 1024),
      createMockFile('test3.pdf', 1024),
    ]

    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)

    expect(screen.getByText('Maximum 2 files allowed')).toBeInTheDocument()
    expect(mockOnFilesSelected).not.toHaveBeenCalled()
  })

  it('validates file size limit', async () => {
    const user = userEvent.setup()
    const maxSize = 1024 // 1KB
    render(
      <FileDropZone onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />
    )

    const file = createMockFile('large.pdf', 2048) // 2KB
    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText(/File large.pdf is too large/)).toBeInTheDocument()
    expect(mockOnFilesSelected).not.toHaveBeenCalled()
  })

  it('handles drag and drop events', () => {
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    const dropZone = screen.getByRole('button')

    // Test drag over
    fireEvent.dragOver(dropZone)
    expect(dropZone).toHaveClass('border-border-focus', 'bg-accent-brand-light')

    // Test drag leave
    fireEvent.dragLeave(dropZone)
    expect(dropZone).not.toHaveClass(
      'border-border-focus',
      'bg-accent-brand-light'
    )
  })

  it('handles file drop', () => {
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('dropped.pdf', 1024)
    const dropZone = screen.getByRole('button')

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(mockOnFilesSelected).toHaveBeenCalledWith([file])
  })

  it('handles disabled state', async () => {
    const user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} disabled />)

    const dropZone = screen.getByRole('button')
    expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed')

    const file = createMockFile('test.pdf', 1024)
    const input = dropZone.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    await user.upload(input, file)
    expect(mockOnFilesSelected).not.toHaveBeenCalled()
  })

  it('accepts single file when maxFiles is 1', () => {
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxFiles={1} />)

    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toHaveAttribute('multiple')
  })

  it('accepts multiple files when maxFiles > 1', () => {
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxFiles={5} />)

    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toHaveAttribute('multiple')
  })

  it('applies custom accept attribute', () => {
    render(
      <FileDropZone onFilesSelected={mockOnFilesSelected} accept=".pdf,.jpg" />
    )

    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toHaveAttribute('accept', '.pdf,.jpg')
  })

  it('clears error when valid files are selected', async () => {
    const user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} maxFiles={1} />)

    // First, upload too many files to trigger error
    const tooManyFiles = [
      createMockFile('test1.pdf', 1024),
      createMockFile('test2.pdf', 1024),
    ]

    const input = screen
      .getByRole('button')
      .querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, tooManyFiles)

    expect(screen.getByText('Maximum 1 files allowed')).toBeInTheDocument()

    // Then upload a valid single file
    const validFile = createMockFile('valid.pdf', 1024)
    await user.upload(input, validFile)

    expect(
      screen.queryByText('Maximum 1 files allowed')
    ).not.toBeInTheDocument()
    expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile])
  })
})
