// UI Component TypeScript definitions
// Comprehensive type system for all UI components and interactions

import type { ReactNode, CSSProperties, ComponentType } from 'react'
import type { LoadingState, ThemeMode } from './index'

// Base component types
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  'data-testid'?: string
  id?: string
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: (event: React.MouseEvent) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
}

// Button component types
export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

export interface ButtonProps extends InteractiveComponentProps {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  fullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  href?: string
  target?: string
  rel?: string
}

// Input component types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
export type InputVariant = 'outlined' | 'filled' | 'standard'

export interface InputProps extends BaseComponentProps {
  type?: InputType
  variant?: InputVariant
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  error?: boolean
  helperText?: string
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  multiline?: boolean
  rows?: number
  maxRows?: number
  autoFocus?: boolean
  autoComplete?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

// Select component types
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[]
  value?: string | number | string[] | number[]
  defaultValue?: string | number | string[] | number[]
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  error?: boolean
  helperText?: string
  label?: string
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  onCreate?: (inputValue: string) => SelectOption
  onChange?: (value: string | number | string[] | number[]) => void
  onBlur?: () => void
  onFocus?: () => void
}

// Modal and Dialog types
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  fullScreen?: boolean
  disableBackdropClick?: boolean
  disableEscapeKeyDown?: boolean
  keepMounted?: boolean
  closeAfterTransition?: boolean
}

export interface DialogProps extends ModalProps {
  title?: ReactNode
  content?: ReactNode
  actions?: ReactNode
  dividers?: boolean
}

// Toast and Notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface ToastProps {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

export interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

// Loading and Progress types
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  thickness?: number
}

export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | false
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: ButtonColor
  showValue?: boolean
  striped?: boolean
  animated?: boolean
}

// Table component types
export interface TableColumn<T = any> {
  key: string
  title: ReactNode
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => ReactNode
  width?: string | number
  sortable?: boolean
  filterable?: boolean
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    onChange: (page: number, pageSize: number) => void
  }
  rowSelection?: {
    type: 'checkbox' | 'radio'
    selectedRowKeys: string[]
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void
  }
  expandable?: {
    expandedRowKeys: string[]
    expandedRowRender: (record: T) => ReactNode
    onExpand: (expanded: boolean, record: T) => void
  }
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    onDoubleClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }
}

// Form component types
export interface FormFieldProps extends BaseComponentProps {
  name: string
  label?: string
  required?: boolean
  rules?: ValidationRule[]
  children: ReactNode
}

export interface ValidationRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  validator?: (value: any) => boolean | Promise<boolean>
}

export interface FormProps extends BaseComponentProps {
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  onValuesChange?: (changedValues: Record<string, any>, allValues: Record<string, any>) => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  children: ReactNode
}

// Navigation component types
export interface NavigationItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  path?: string
  children?: NavigationItem[]
  disabled?: boolean
  badge?: {
    count: number
    color?: string
  }
}

export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[]
  selectedKeys?: string[]
  openKeys?: string[]
  mode?: 'horizontal' | 'vertical' | 'inline'
  theme?: 'light' | 'dark'
  collapsed?: boolean
  onClick?: (item: NavigationItem) => void
  onSelect?: (selectedKeys: string[]) => void
  onOpenChange?: (openKeys: string[]) => void
}

// Card component types
export interface CardProps extends BaseComponentProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  cover?: ReactNode
  avatar?: ReactNode
  bordered?: boolean
  hoverable?: boolean
  loading?: boolean
  size?: 'small' | 'default'
  children?: ReactNode
}

// Chip/Tag component types
export interface ChipProps extends BaseComponentProps {
  label: string
  variant?: 'filled' | 'outlined'
  color?: ButtonColor
  size?: 'sm' | 'md'
  deletable?: boolean
  clickable?: boolean
  avatar?: ReactNode
  icon?: ReactNode
  onDelete?: () => void
  onClick?: () => void
}

// Tooltip component types
export interface TooltipProps {
  title: ReactNode
  placement?: 
    | 'top' | 'top-start' | 'top-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
    | 'right' | 'right-start' | 'right-end'
  arrow?: boolean
  disabled?: boolean
  children: ReactNode
}

// Dropdown component types
export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  children?: DropdownItem[]
}

export interface DropdownProps extends BaseComponentProps {
  items: DropdownItem[]
  trigger?: 'hover' | 'click' | 'contextMenu'
  placement?: TooltipProps['placement']
  disabled?: boolean
  children: ReactNode
  onItemClick?: (item: DropdownItem) => void
}

// Tabs component types
export interface TabItem {
  key: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
  closable?: boolean
  icon?: ReactNode
}

export interface TabsProps extends BaseComponentProps {
  items: TabItem[]
  activeKey?: string
  defaultActiveKey?: string
  type?: 'line' | 'card' | 'editable-card'
  size?: 'sm' | 'md' | 'lg'
  tabPosition?: 'top' | 'bottom' | 'left' | 'right'
  onChange?: (activeKey: string) => void
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void
}

// Accordion component types
export interface AccordionItem {
  key: string
  title: ReactNode
  content: ReactNode
  disabled?: boolean
  extra?: ReactNode
}

export interface AccordionProps extends BaseComponentProps {
  items: AccordionItem[]
  activeKey?: string | string[]
  defaultActiveKey?: string | string[]
  accordion?: boolean
  bordered?: boolean
  ghost?: boolean
  onChange?: (key: string | string[]) => void
}

// Layout component types
export interface LayoutProps extends BaseComponentProps {
  children: ReactNode
}

export interface HeaderProps extends LayoutProps {
  height?: string | number
  fixed?: boolean
  sticky?: boolean
}

export interface SidebarProps extends LayoutProps {
  width?: string | number
  collapsed?: boolean
  collapsible?: boolean
  onCollapse?: (collapsed: boolean) => void
  position?: 'left' | 'right'
}

export interface ContentProps extends LayoutProps {
  padding?: string | number
}

export interface FooterProps extends LayoutProps {
  height?: string | number
  sticky?: boolean
}

// Theme and styling types
export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  colors: Record<string, string>
  typography: {
    fontFamily: string
    fontSize: Record<string, string>
    fontWeight: Record<string, number>
    lineHeight: Record<string, string>
  }
  spacing: Record<string, string>
  breakpoints: Record<string, string>
  shadows: Record<string, string>
  transitions: Record<string, string>
}

// Accessibility types
export interface AccessibilityProps {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean
  'aria-disabled'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-atomic'?: boolean
  tabIndex?: number
}

// Animation and motion types
export interface MotionProps {
  initial?: any
  animate?: any
  exit?: any
  transition?: any
  variants?: any
  whileHover?: any
  whileTap?: any
  whileFocus?: any
  drag?: boolean | 'x' | 'y'
  dragConstraints?: any
  onAnimationComplete?: () => void
}

// Error boundary types
export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
  showDetails?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

// Virtualization types
export interface VirtualListProps<T = any> extends BaseComponentProps {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => ReactNode
  height: number
  width?: number
  overscan?: number
  onScroll?: (scrollTop: number) => void
}

// Search and filter types
export interface SearchProps extends BaseComponentProps {
  value?: string
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  clearable?: boolean
  onSearch?: (value: string) => void
  onChange?: (value: string) => void
  onClear?: () => void
}

export interface FilterProps<T = any> extends BaseComponentProps {
  filters: Array<{
    key: string
    label: string
    type: 'text' | 'select' | 'date' | 'number' | 'boolean'
    options?: SelectOption[]
  }>
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  onReset: () => void
}

// Performance optimization types
export interface LazyComponentProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  loadingText?: string
  minHeight?: string
}

export interface MemoComponentProps {
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean
}

// HOC types
export type WithLoadingHOC<P = {}> = (Component: ComponentType<P>) => ComponentType<P & { loading?: boolean }>
export type WithErrorBoundaryHOC<P = {}> = (Component: ComponentType<P>) => ComponentType<P>
export type WithAccessibilityHOC<P = {}> = (Component: ComponentType<P>) => ComponentType<P & AccessibilityProps>

// Custom hook return types
export interface UseDisclosure {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export interface UseLocalStorage<T> {
  value: T
  setValue: (value: T) => void
  removeValue: () => void
}

export interface UseDebounce<T> {
  debouncedValue: T
  isDebouncing: boolean
}

export interface UseAsyncOperation<T, E = Error> {
  data: T | null
  loading: boolean
  error: E | null
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}