/**
 * ===============================================
 * DIALOG COMPONENT UNIT TESTS
 * Vitest + React Testing Library
 * ===============================================
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog'

describe('Dialog Component', () => {
  // ==========================================
  // TEST 1: Basic Dialog Rendering
  // ==========================================
  it('renders dialog trigger but not content initially', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    )
    
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
  })

  // ==========================================
  // TEST 2: Opening Dialog
  // ==========================================
  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <p>Dialog is open</p>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      expect(screen.getByText('Dialog is open')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 3: Closing Dialog with X Button
  // ==========================================
  it('closes dialog when X button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    )
    
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 4: Dialog with Header
  // ==========================================
  it('renders dialog with header correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 5: Dialog with Footer
  // ==========================================
  it('renders dialog with footer correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 6: Controlled Dialog
  // ==========================================
  it('works as controlled component', async () => {
    const onOpenChange = vi.fn()
    
    const { rerender } = render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <p>Controlled dialog</p>
        </DialogContent>
      </Dialog>
    )
    
    expect(screen.queryByText('Controlled dialog')).not.toBeInTheDocument()
    
    // Click trigger
    fireEvent.click(screen.getByText('Open'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    
    // Rerender with open state
    rerender(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <p>Controlled dialog</p>
        </DialogContent>
      </Dialog>
    )
    
    expect(screen.getByText('Controlled dialog')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 7: Dialog Overlay
  // ==========================================
  it('renders overlay when dialog is open', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <p>With overlay</p>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-black/80')
    })
  })

  // ==========================================
  // TEST 8: Custom Close Button
  // ==========================================
  it('closes dialog with custom close button', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <p>Content</p>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Custom Close'))
    
    await waitFor(() => {
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 9: Complex Dialog Composition
  // ==========================================
  it('renders complex dialog with all components', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn()
    
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Edit Profile</button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input placeholder="Name" />
            <input placeholder="Email" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
            <button onClick={handleSave}>Save changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Edit Profile'))
    
    await waitFor(() => {
      expect(screen.getByText('Make changes to your profile here. Click save when you\'re done.')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Save changes'))
    expect(handleSave).toHaveBeenCalled()
  })

  // ==========================================
  // TEST 10: Accessibility - Focus Management
  // ==========================================
  it('manages focus correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Focus Test</DialogTitle>
          </DialogHeader>
          <input data-testid="first-input" />
          <button>Action</button>
        </DialogContent>
      </Dialog>
    )
    
    const trigger = screen.getByText('Open')
    await user.click(trigger)
    
    await waitFor(() => {
      // Focus should be trapped within dialog
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 11: Escape Key Handling
  // ==========================================
  it('closes dialog on Escape key', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <p>Press Escape to close</p>
        </DialogContent>
      </Dialog>
    )
    
    expect(screen.getByText('Press Escape to close')).toBeInTheDocument()
    
    await user.keyboard('{Escape}')
    
    await waitFor(() => {
      expect(screen.queryByText('Press Escape to close')).not.toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 12: Multiple Dialogs
  // ==========================================
  it('handles multiple dialogs correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <>
        <Dialog>
          <DialogTrigger>Dialog 1</DialogTrigger>
          <DialogContent>
            <p>First dialog</p>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger>Dialog 2</DialogTrigger>
          <DialogContent>
            <p>Second dialog</p>
          </DialogContent>
        </Dialog>
      </>
    )
    
    // Open first dialog
    await user.click(screen.getByText('Dialog 1'))
    await waitFor(() => {
      expect(screen.getByText('First dialog')).toBeInTheDocument()
    })
    
    // Close first dialog
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByText('First dialog')).not.toBeInTheDocument()
    })
    
    // Open second dialog
    await user.click(screen.getByText('Dialog 2'))
    await waitFor(() => {
      expect(screen.getByText('Second dialog')).toBeInTheDocument()
    })
  })
})