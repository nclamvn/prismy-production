import React from 'react'
import { Button, ButtonProps } from './button'
import { useAnnouncer, useId } from '../hooks/use-keyboard-navigation'
import { announceToScreenReader } from '../utils/accessibility'

// Enhanced button with accessibility features
export interface AccessibleButtonProps extends Omit<ButtonProps, 'onToggle'> {
  // Accessibility specific props
  describedBy?: string
  announcement?: string
  announceOnClick?: boolean
  role?: 'button' | 'switch' | 'tab' | 'menuitem'
  pressed?: boolean
  expanded?: boolean
  controls?: string
  haspopup?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  
  // Enhanced interaction
  onPress?: () => void
  onToggle?: (pressed: boolean) => void
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children,
    describedBy,
    announcement,
    announceOnClick = false,
    role = 'button',
    pressed,
    expanded,
    controls,
    haspopup,
    onPress,
    onToggle,
    onClick,
    ...props 
  }, ref) => {
    const buttonId = useId('accessible-button')
    const { announce } = useAnnouncer()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Handle toggle functionality
      if (role === 'switch' && onToggle) {
        const newPressed = !pressed
        onToggle(newPressed)
        
        // Announce state change
        const stateMessage = newPressed ? 'activated' : 'deactivated'
        announce(`${children} ${stateMessage}`)
      }

      // Handle press functionality
      if (onPress) {
        onPress()
      }

      // Handle announcements
      if (announceOnClick && announcement) {
        announceToScreenReader(announcement)
      }

      // Call original onClick
      onClick?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Enhanced keyboard handling for different roles
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        
        // Trigger the same logic as handleClick but without needing a mouse event
        if (role === 'switch' && onToggle) {
          const newPressed = !pressed
          onToggle(newPressed)
          announce(`${children} ${newPressed ? 'activated' : 'deactivated'}`)
        }

        if (onPress) {
          onPress()
        }

        if (announceOnClick && announcement) {
          announceToScreenReader(announcement)
        }
      }

      // Handle arrow keys for tab role
      if (role === 'tab') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          // Emit custom event for tab navigation
          const direction = e.key === 'ArrowRight' ? 'next' : 'prev'
          e.currentTarget.dispatchEvent(
            new CustomEvent('tab-navigate', { 
              detail: { direction, currentTab: e.currentTarget }
            })
          )
        }
      }
    }

    // Build ARIA attributes
    const ariaAttributes: Record<string, string | boolean | undefined> = {
      'aria-describedby': describedBy,
      role: role !== 'button' ? role : undefined,
    }

    // Add state attributes based on role
    if (role === 'switch' || pressed !== undefined) {
      ariaAttributes['aria-pressed'] = pressed
    }

    if (expanded !== undefined) {
      ariaAttributes['aria-expanded'] = expanded
    }

    if (controls) {
      ariaAttributes['aria-controls'] = controls
    }

    if (haspopup) {
      ariaAttributes['aria-haspopup'] = haspopup
    }

    // Remove undefined attributes
    Object.keys(ariaAttributes).forEach(key => {
      if (ariaAttributes[key] === undefined) {
        delete ariaAttributes[key]
      }
    })

    return (
      <Button
        ref={ref}
        id={buttonId}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...ariaAttributes}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

// Toggle Button Component
export interface ToggleButtonProps extends Omit<AccessibleButtonProps, 'role' | 'pressed' | 'onToggle'> {
  pressed: boolean
  onToggle: (pressed: boolean) => void
  pressedLabel?: string
  unpressedLabel?: string
}

export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ 
    pressed, 
    onToggle, 
    pressedLabel = 'activated',
    unpressedLabel = 'deactivated',
    children,
    ...props 
  }, ref) => {
    return (
      <AccessibleButton
        ref={ref}
        role="switch"
        pressed={pressed}
        onToggle={onToggle}
        announcement={pressed ? pressedLabel : unpressedLabel}
        announceOnClick
        {...props}
      >
        {children}
      </AccessibleButton>
    )
  }
)

ToggleButton.displayName = 'ToggleButton'

// Menu Button Component
export interface MenuButtonProps extends Omit<AccessibleButtonProps, 'role' | 'haspopup' | 'expanded'> {
  menuId: string
  expanded: boolean
  onToggle: (expanded: boolean) => void
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ 
    menuId,
    expanded, 
    onToggle,
    children,
    ...props 
  }, ref) => {
    const handleToggle = () => {
      onToggle(!expanded)
    }

    return (
      <AccessibleButton
        ref={ref}
        role="button"
        haspopup="menu"
        expanded={expanded}
        controls={menuId}
        onPress={handleToggle}
        announcement={expanded ? 'Menu collapsed' : 'Menu expanded'}
        announceOnClick
        {...props}
      >
        {children}
      </AccessibleButton>
    )
  }
)

MenuButton.displayName = 'MenuButton'

// Tab Button Component  
export interface TabButtonProps extends Omit<AccessibleButtonProps, 'role'> {
  tabId: string
  panelId: string
  selected: boolean
  onSelect: () => void
}

export const TabButton = React.forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ 
    tabId,
    panelId,
    selected,
    onSelect,
    children,
    ...props 
  }, ref) => {
    return (
      <AccessibleButton
        ref={ref}
        role="tab"
        id={tabId}
        controls={panelId}
        aria-selected={selected}
        onPress={onSelect}
        tabIndex={selected ? 0 : -1}
        {...props}
      >
        {children}
      </AccessibleButton>
    )
  }
)

TabButton.displayName = 'TabButton'