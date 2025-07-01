'use client'

import { useState } from 'react'
import { Settings, X, Eye, Type, Move, Keyboard, Volume2, Contrast } from 'lucide-react'
import { useAccessibility } from './AccessibilityProvider'
import { Button } from '@/components/ui/Button'

interface AccessibilityPanelProps {
  language?: 'vi' | 'en'
}

export default function AccessibilityPanel({ language = 'en' }: AccessibilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSetting, announceToScreenReader } = useAccessibility()

  const content = {
    vi: {
      title: 'Cài đặt trợ năng',
      subtitle: 'Tùy chỉnh trải nghiệm để phù hợp với nhu cầu của bạn',
      highContrast: 'Độ tương phản cao',
      highContrastDesc: 'Tăng độ tương phản cho khả năng nhìn tốt hơn',
      reducedMotion: 'Giảm chuyển động',
      reducedMotionDesc: 'Giảm hoạt ảnh và hiệu ứng chuyển tiếp',
      largeText: 'Văn bản lớn',
      largeTextDesc: 'Tăng kích thước phông chữ để đọc dễ hơn',
      dyslexiaFriendly: 'Thân thiện với chứng khó đọc',
      dyslexiaFriendlyDesc: 'Tối ưu hóa khoảng cách và phông chữ',
      keyboardNavigation: 'Điều hướng bàn phím',
      keyboardNavigationDesc: 'Bật tất cả tính năng điều hướng bàn phím',
      screenReaderMode: 'Chế độ đọc màn hình',
      screenReaderModeDesc: 'Tối ưu hóa cho phần mềm đọc màn hình',
      close: 'Đóng',
      reset: 'Đặt lại mặc định',
      save: 'Lưu cài đặt'
    },
    en: {
      title: 'Accessibility Settings',
      subtitle: 'Customize your experience to meet your needs',
      highContrast: 'High Contrast',
      highContrastDesc: 'Increase contrast for better visibility',
      reducedMotion: 'Reduced Motion',
      reducedMotionDesc: 'Reduce animations and transitions',
      largeText: 'Large Text',
      largeTextDesc: 'Increase font sizes for easier reading',
      dyslexiaFriendly: 'Dyslexia Friendly',
      dyslexiaFriendlyDesc: 'Optimize spacing and fonts',
      keyboardNavigation: 'Keyboard Navigation',
      keyboardNavigationDesc: 'Enable all keyboard navigation features',
      screenReaderMode: 'Screen Reader Mode',
      screenReaderModeDesc: 'Optimize for screen reader software',
      close: 'Close',
      reset: 'Reset to Default',
      save: 'Save Settings'
    }
  }

  const accessibilityOptions = [
    {
      key: 'highContrast' as const,
      icon: Contrast,
      label: content[language].highContrast,
      description: content[language].highContrastDesc
    },
    {
      key: 'reducedMotion' as const,
      icon: Move,
      label: content[language].reducedMotion,
      description: content[language].reducedMotionDesc
    },
    {
      key: 'largeText' as const,
      icon: Type,
      label: content[language].largeText,
      description: content[language].largeTextDesc
    },
    {
      key: 'dyslexiaFriendly' as const,
      icon: Eye,
      label: content[language].dyslexiaFriendly,
      description: content[language].dyslexiaFriendlyDesc
    },
    {
      key: 'keyboardNavigation' as const,
      icon: Keyboard,
      label: content[language].keyboardNavigation,
      description: content[language].keyboardNavigationDesc
    },
    {
      key: 'screenReaderMode' as const,
      icon: Volume2,
      label: content[language].screenReaderMode,
      description: content[language].screenReaderModeDesc
    }
  ]

  const handleToggle = (key: keyof typeof settings) => {
    const newValue = !settings[key]
    updateSetting(key, newValue)
    announceToScreenReader(
      `${accessibilityOptions.find(opt => opt.key === key)?.label} ${newValue ? 'enabled' : 'disabled'}`
    )
  }

  const handleReset = () => {
    Object.keys(settings).forEach(key => {
      updateSetting(key as keyof typeof settings, false)
    })
    updateSetting('keyboardNavigation', true) // Keep keyboard nav enabled by default
    announceToScreenReader('Accessibility settings reset to default')
  }

  const handleSave = () => {
    announceToScreenReader('Accessibility settings saved')
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Accessibility Button */}
      <Button
        variant="elevated"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 p-0"
        aria-label={content[language].title}
        style={{
          borderRadius: '50%',
          boxShadow: 'var(--elevation-level-3)'
        }}
      >
        <Settings className="w-6 h-6" aria-hidden="true" />
      </Button>

      {/* Accessibility Panel Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 animate-fade-in"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-auto focus-trap animate-modal-spring"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderRadius: 'var(--mat-card-elevated-container-shape)',
                boxShadow: 'var(--elevation-level-5)',
                border: '1px solid var(--surface-outline)'
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="accessibility-title"
              aria-describedby="accessibility-description"
            >
                {/* Header */}
                <div 
                  className="flex items-center justify-between p-6"
                  style={{
                    borderBottom: '1px solid var(--surface-outline)'
                  }}
                >
                  <div>
                    <h2 
                      id="accessibility-title"
                      style={{
                        fontSize: 'var(--sys-headline-medium-size)',
                        lineHeight: 'var(--sys-headline-medium-line-height)',
                        fontFamily: 'var(--sys-headline-medium-font)',
                        fontWeight: 'var(--sys-headline-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {content[language].title}
                    </h2>
                    <p 
                      id="accessibility-description"
                      className="mt-1"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {content[language].subtitle}
                    </p>
                  </div>
                  <Button
                    variant="text"
                    onClick={() => setIsOpen(false)}
                    className="p-2"
                    aria-label={content[language].close}
                    data-close
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                  {accessibilityOptions.map((option) => {
                    const Icon = option.icon
                    const isEnabled = settings[option.key]
                    
                    return (
                      <div
                        key={option.key}
                        className="flex items-start space-x-4 p-4 transition-all"
                        style={{
                          backgroundColor: isEnabled ? 'var(--notebooklm-primary-light)' : 'var(--surface-filled)',
                          borderRadius: 'var(--mat-card-outlined-container-shape)',
                          border: isEnabled ? '1px solid var(--notebooklm-primary)' : '1px solid var(--surface-outline)'
                        }}
                      >
                        <div 
                          className="p-2"
                          style={{
                            backgroundColor: isEnabled ? 'var(--notebooklm-primary)' : 'var(--surface-panel)',
                            borderRadius: 'var(--mat-card-outlined-container-shape)',
                            color: isEnabled ? 'white' : 'var(--text-secondary)'
                          }}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        
                        <div className="flex-1">
                          <label 
                            htmlFor={`toggle-${option.key}`}
                            className="block cursor-pointer"
                            style={{
                              fontSize: 'var(--sys-title-medium-size)',
                              lineHeight: 'var(--sys-title-medium-line-height)',
                              fontFamily: 'var(--sys-title-medium-font)',
                              fontWeight: 'var(--sys-title-medium-weight)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {option.label}
                          </label>
                          <p 
                            style={{
                              fontSize: 'var(--sys-body-medium-size)',
                              lineHeight: 'var(--sys-body-medium-line-height)',
                              fontFamily: 'var(--sys-body-medium-font)',
                              fontWeight: 'var(--sys-body-medium-weight)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {option.description}
                          </p>
                        </div>
                        
                        <button
                          id={`toggle-${option.key}`}
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => handleToggle(option.key)}
                          className="relative w-12 h-6 transition-all focus-indicator"
                          style={{
                            backgroundColor: isEnabled ? 'var(--notebooklm-primary)' : 'var(--surface-outline)',
                            borderRadius: '12px'
                          }}
                          aria-describedby={`desc-${option.key}`}
                        >
                          <div
                            className="absolute top-1 w-4 h-4 transition-all rounded-full"
                            style={{
                              backgroundColor: 'white',
                              left: isEnabled ? '26px' : '2px',
                              boxShadow: 'var(--elevation-level-1)'
                            }}
                          />
                          <span id={`desc-${option.key}`} className="sr-only">
                            {option.description}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div 
                  className="flex items-center justify-between p-6"
                  style={{
                    borderTop: '1px solid var(--surface-outline)'
                  }}
                >
                  <Button
                    variant="text"
                    onClick={handleReset}
                    aria-describedby="reset-description"
                  >
                    {content[language].reset}
                    <span id="reset-description" className="sr-only">
                      This will disable all accessibility options except keyboard navigation
                    </span>
                  </Button>
                  
                  <Button
                    variant="filled"
                    onClick={handleSave}
                  >
                    {content[language].save}
                  </Button>
                </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}