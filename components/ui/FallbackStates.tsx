'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Search,
  FileX,
  Users,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Button } from './Button'
import { motionSafe, fadeIn, slideUp } from '@/lib/motion'

interface FallbackStateProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// Loading States
export const LoadingFallback: React.FC<FallbackStateProps & {
  message?: string
  showSpinner?: boolean
  lines?: number
}> = ({ 
  message = 'Loading...', 
  showSpinner = true, 
  lines = 3, 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <motion.div
      variants={motionSafe(fadeIn)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      {showSpinner && (
        <Loader2 
          className={`${iconSizes[size]} animate-spin mb-3`}
          style={{ color: 'var(--notebooklm-primary)' }}
        />
      )}
      
      <p 
        className="text-center mb-4"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px'
        }}
      >
        {message}
      </p>

      {/* Skeleton lines */}
      <div className="w-full max-w-sm space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-3 rounded animate-pulse"
            style={{ 
              backgroundColor: 'var(--surface-outline)',
              width: `${100 - (i * 15)}%` 
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Empty States
export const EmptyStateFallback: React.FC<FallbackStateProps & {
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'search' | 'data' | 'user' | 'file' | 'generic'
}> = ({ 
  icon,
  title,
  message,
  action,
  variant = 'generic',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  }

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const getDefaultContent = () => {
    switch (variant) {
      case 'search':
        return {
          icon: <Search className={iconSizes[size]} />,
          title: 'No results found',
          message: 'Try adjusting your search criteria or browse available options.'
        }
      case 'data':
        return {
          icon: <FileX className={iconSizes[size]} />,
          title: 'No data available',
          message: 'There\'s no data to display at the moment. Check back later or try refreshing.'
        }
      case 'user':
        return {
          icon: <Users className={iconSizes[size]} />,
          title: 'No users found',
          message: 'No users match your current criteria. Try expanding your search.'
        }
      case 'file':
        return {
          icon: <FileX className={iconSizes[size]} />,
          title: 'No files found',
          message: 'No files are available in this location. Try uploading some files.'
        }
      default:
        return {
          icon: <AlertCircle className={iconSizes[size]} />,
          title: 'Nothing to show',
          message: 'There\'s nothing here yet. Content will appear when available.'
        }
    }
  }

  const defaultContent = getDefaultContent()

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{ color: 'var(--text-disabled)' }}
      >
        {icon || defaultContent.icon}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 font-semibold"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '18px' : '20px'
        }}
      >
        {title || defaultContent.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : '16px'
        }}
      >
        {message || defaultContent.message}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outlined"
            onClick={action.onClick}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Network Error States
export const NetworkErrorFallback: React.FC<FallbackStateProps & {
  onRetry?: () => void
  isOffline?: boolean
}> = ({ 
  onRetry,
  isOffline = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{ color: 'var(--text-error)' }}
      >
        {isOffline ? (
          <WifiOff className={iconSizes[size]} />
        ) : (
          <Wifi className={iconSizes[size]} />
        )}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 font-semibold"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '18px' : '20px'
        }}
      >
        {isOffline ? 'You\'re offline' : 'Connection problem'}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : '16px'
        }}
      >
        {isOffline 
          ? 'Check your internet connection and try again.'
          : 'We\'re having trouble connecting to our servers. Please try again.'}
      </motion.p>

      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="filled"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Timeout/Slow Loading State
export const TimeoutFallback: React.FC<FallbackStateProps & {
  onRetry?: () => void
  onCancel?: () => void
  timeout?: number
}> = ({ 
  onRetry,
  onCancel,
  timeout = 30,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{ color: 'var(--text-warning)' }}
      >
        <Clock className="w-16 h-16" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 font-semibold"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '18px' : '20px'
        }}
      >
        This is taking longer than usual
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : '16px'
        }}
      >
        The request has been running for more than {timeout} seconds. You can wait a bit longer or try again.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        {onRetry && (
          <Button
            variant="filled"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Permission Denied State
export const PermissionDeniedFallback: React.FC<FallbackStateProps & {
  onRequestAccess?: () => void
  onGoBack?: () => void
  message?: string
}> = ({ 
  onRequestAccess,
  onGoBack,
  message,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{ color: 'var(--text-warning)' }}
      >
        <Shield className="w-16 h-16" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 font-semibold"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '18px' : '20px'
        }}
      >
        Access Denied
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : '16px'
        }}
      >
        {message || 'You don\'t have permission to access this resource. Contact your administrator for access.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        {onRequestAccess && (
          <Button
            variant="filled"
            onClick={onRequestAccess}
          >
            Request Access
          </Button>
        )}
        
        {onGoBack && (
          <Button
            variant="outlined"
            onClick={onGoBack}
          >
            Go Back
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Maintenance Mode State
export const MaintenanceFallback: React.FC<FallbackStateProps & {
  estimatedTime?: string
  onRefresh?: () => void
}> = ({ 
  estimatedTime,
  onRefresh,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: 'var(--surface-elevated)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{ color: 'var(--text-warning)' }}
      >
        <AlertTriangle className="w-16 h-16" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 font-semibold"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '18px' : '20px'
        }}
      >
        Under Maintenance
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm"
        style={{ 
          color: 'var(--text-secondary)',
          fontSize: size === 'sm' ? '14px' : '16px'
        }}
      >
        We're currently performing scheduled maintenance. 
        {estimatedTime && ` Expected completion: ${estimatedTime}.`}
        We'll be back soon!
      </motion.p>

      {onRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outlined"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Generic fallback component that chooses the appropriate state
export const SmartFallback: React.FC<{
  type: 'loading' | 'empty' | 'error' | 'network' | 'timeout' | 'permission' | 'maintenance'
  props?: any
  className?: string
}> = ({ type, props = {}, className = '' }) => {
  switch (type) {
    case 'loading':
      return <LoadingFallback {...props} className={className} />
    case 'empty':
      return <EmptyStateFallback {...props} className={className} />
    case 'network':
      return <NetworkErrorFallback {...props} className={className} />
    case 'timeout':
      return <TimeoutFallback {...props} className={className} />
    case 'permission':
      return <PermissionDeniedFallback {...props} className={className} />
    case 'maintenance':
      return <MaintenanceFallback {...props} className={className} />
    default:
      return <EmptyStateFallback {...props} className={className} />
  }
}

export default SmartFallback