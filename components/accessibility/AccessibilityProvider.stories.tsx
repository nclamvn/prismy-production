import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { AccessibilityProvider, useAccessibility } from './AccessibilityProvider'
import { Button } from '../ui/Button'

// Demo component to showcase accessibility features
const AccessibilityDemo = () => {
  const { reducedMotion, highContrast, fontSize, announceMessage, focusElement } = useAccessibility()
  
  const handleAnnounce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceMessage(message, priority)
  }
  
  const handleFocusElement = (selector: string) => {
    focusElement(selector)
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Accessibility Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Reduced Motion:</strong> {reducedMotion ? 'Enabled' : 'Disabled'}
            <p className="text-gray-600">
              {reducedMotion ? 'Animations are minimized' : 'Full animations enabled'}
            </p>
          </div>
          <div>
            <strong>High Contrast:</strong> {highContrast ? 'Enabled' : 'Disabled'}
            <p className="text-gray-600">
              {highContrast ? 'Enhanced contrast colors' : 'Standard contrast'}
            </p>
          </div>
          <div>
            <strong>Font Size:</strong> {fontSize}
            <p className="text-gray-600">
              Current text size preference
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Screen Reader Announcements</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleAnnounce('This is a polite announcement')}>
            Polite Announcement
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAnnounce('This is an assertive announcement!', 'assertive')}
          >
            Assertive Announcement
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => handleAnnounce('Form saved successfully', 'polite')}
          >
            Success Message
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          These buttons create announcements for screen readers. Turn on a screen reader to hear them.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Focus Management</h3>
        <div className="space-y-2">
          <input 
            id="focus-target-1" 
            placeholder="Focus target 1" 
            className="px-3 py-2 border rounded-md"
          />
          <input 
            id="focus-target-2" 
            placeholder="Focus target 2" 
            className="px-3 py-2 border rounded-md"
          />
          <textarea 
            id="focus-target-3" 
            placeholder="Focus target 3 (textarea)" 
            className="px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleFocusElement('#focus-target-1')}>
            Focus Input 1
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleFocusElement('#focus-target-2')}
          >
            Focus Input 2
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => handleFocusElement('#focus-target-3')}
          >
            Focus Textarea
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          These buttons programmatically move focus to different form elements.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Keyboard Navigation</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Try these keyboard shortcuts:</h4>
          <ul className="text-sm space-y-1">
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd> - Navigate through interactive elements</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Shift + Tab</kbd> - Navigate backwards</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> - Activate buttons</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Escape</kbd> - Close modals/dropdowns</li>
          </ul>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Skip Links</h3>
        <p className="text-sm text-gray-600">
          Press Tab when this story loads to see the "Skip to main content" link appear.
          This helps keyboard users navigate quickly to the main content.
        </p>
      </div>
    </div>
  )
}

const meta: Meta<typeof AccessibilityProvider> = {
  title: 'Accessibility/AccessibilityProvider',
  component: AccessibilityProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive accessibility provider that manages user preferences, screen reader announcements, focus management, and keyboard navigation. Automatically detects and responds to system accessibility preferences.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AccessibilityProvider>

export const Default: Story = {
  render: () => (
    <AccessibilityProvider>
      <AccessibilityDemo />
    </AccessibilityProvider>
  ),
}

export const ReducedMotionSimulation: Story = {
  render: () => {
    // Simulate reduced motion preference
    React.useEffect(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
            }
          }
          return {
            matches: false,
            media: query,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
          }
        }),
      })
    }, [])
    
    return (
      <AccessibilityProvider>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Reduced Motion Mode</h2>
          <p className="text-gray-600">
            This simulates how the interface appears when users have enabled 
            "reduce motion" in their system preferences.
          </p>
          <AccessibilityDemo />
        </div>
      </AccessibilityProvider>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates reduced motion preferences for users with vestibular motion disorders.',
      },
    },
  },
}

export const HighContrastSimulation: Story = {
  render: () => (
    <div className="high-contrast">
      <AccessibilityProvider>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">High Contrast Mode</h2>
          <p className="text-gray-600">
            This simulates how the interface appears in high contrast mode
            for users with visual impairments.
          </p>
          <AccessibilityDemo />
        </div>
      </AccessibilityProvider>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Simulates high contrast mode for users with visual impairments.',
      },
    },
  },
}

export const BilingualAccessibility: Story = {
  render: () => (
    <AccessibilityProvider>
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">English Interface</h2>
          <div className="space-y-4">
            <Button onClick={() => announceMessage('Settings saved successfully')}>
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => announceMessage('Loading data, please wait', 'assertive')}
            >
              Load Data
            </Button>
          </div>
        </div>
        
        <div dir="rtl" className="rtl">
          <h2 className="text-xl font-semibold mb-4" lang="ar">واجهة عربية</h2>
          <div className="space-y-4">
            <Button onClick={() => announceMessage('تم حفظ الإعدادات بنجاح')}>
              حفظ الإعدادات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => announceMessage('جاري تحميل البيانات، يرجى الانتظار', 'assertive')}
            >
              تحميل البيانات
            </Button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4" lang="vi">Giao diện Tiếng Việt</h2>
          <div className="space-y-4">
            <Button onClick={() => announceMessage('Đã lưu cài đặt thành công')}>
              Lưu Cài Đặt
            </Button>
            <Button 
              variant="outline" 
              onClick={() => announceMessage('Đang tải dữ liệu, vui lòng đợi', 'assertive')}
            >
              Tải Dữ Liệu
            </Button>
          </div>
        </div>
      </div>
    </AccessibilityProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features with multilingual content and RTL support.',
      },
    },
  },
}

export const FocusManagementDemo: Story = {
  render: () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    
    return (
      <AccessibilityProvider>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Focus Management Demo</h2>
          
          <div className="space-y-4">
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Input 1" className="px-3 py-2 border rounded-md" />
              <input placeholder="Input 2" className="px-3 py-2 border rounded-md" />
              <input placeholder="Input 3" className="px-3 py-2 border rounded-md" />
              <input placeholder="Input 4" className="px-3 py-2 border rounded-md" />
            </div>
          </div>
          
          {isModalOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 id="modal-title" className="text-lg font-semibold mb-4">
                  Focus Trap Demo
                </h3>
                <p className="text-gray-600 mb-4">
                  This modal traps focus. Try using Tab and Shift+Tab to navigate.
                  Focus should stay within this modal.
                </p>
                <div className="space-y-2">
                  <input placeholder="Modal input 1" className="w-full px-3 py-2 border rounded-md" />
                  <input placeholder="Modal input 2" className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close modal"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AccessibilityProvider>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates focus trapping in modals and proper focus management.',
      },
    },
  },
}

export const ScreenReaderDemo: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<string[]>([])
    
    const addMessage = (message: string) => {
      setMessages(prev => [...prev, message])
    }
    
    return (
      <AccessibilityProvider>
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">Screen Reader Demo</h2>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm">
              <strong>For developers:</strong> Open your browser's developer tools 
              and watch the DOM as you click these buttons. Screen reader announcements 
              are temporarily added to the DOM with proper ARIA attributes.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Announcement Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Success Messages</h4>
                <Button 
                  onClick={() => {
                    announceMessage('Document saved successfully')
                    addMessage('Document saved successfully')
                  }}
                  className="w-full"
                >
                  Save Document
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    announceMessage('Translation completed')
                    addMessage('Translation completed')
                  }}
                  className="w-full"
                >
                  Complete Translation
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Error Messages</h4>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    announceMessage('Error: Unable to save document', 'assertive')
                    addMessage('Error: Unable to save document')
                  }}
                  className="w-full"
                >
                  Trigger Error
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    announceMessage('Warning: Unsaved changes will be lost', 'assertive')
                    addMessage('Warning: Unsaved changes will be lost')
                  }}
                  className="w-full"
                >
                  Show Warning
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Recent Announcements</h3>
            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
              {messages.length === 0 ? (
                <p className="text-gray-500 italic">No announcements yet</p>
              ) : (
                <ul className="space-y-1">
                  {messages.map((message, index) => (
                    <li key={index} className="text-sm">
                      <span className="text-gray-400">{new Date().toLocaleTimeString()}:</span> {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </AccessibilityProvider>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates screen reader announcements with visual feedback for developers.',
      },
    },
  },
}