'use client'

import { UserPresence } from '@/lib/realtime/collaboration-manager'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Users, Circle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PresenceIndicatorsProps {
  users: UserPresence[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  className?: string
}

export function PresenceIndicators({
  users,
  maxDisplay = 5,
  size = 'md',
  showStatus = true,
  className
}: PresenceIndicatorsProps) {
  const displayUsers = users.slice(0, maxDisplay)
  const remainingCount = Math.max(0, users.length - maxDisplay)

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  }

  const getInitials = (user: UserPresence) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  if (users.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Users className="h-4 w-4" />
        <span className="text-sm">No one else is viewing</span>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center", className)}>
        <div className="flex -space-x-2">
          {displayUsers.map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      "border-2 border-background ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110"
                    )}
                    style={{ borderColor: user.color }}
                  >
                    <AvatarFallback
                      className="font-medium"
                      style={{ backgroundColor: user.color, color: 'white' }}
                    >
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {showStatus && (
                    <Circle
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                        getStatusColor(user.status)
                      )}
                      fill="currentColor"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{user.displayName || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                  {user.lastSeen && (
                    <p className="text-xs text-muted-foreground">
                      Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className={cn(sizeClasses[size], "border-2 border-background")}>
                  <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more {remainingCount === 1 ? 'person' : 'people'} viewing</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Badge variant="secondary" className="ml-3">
          <Users className="h-3 w-3 mr-1" />
          {users.length} {users.length === 1 ? 'viewer' : 'viewers'}
        </Badge>
      </div>
    </TooltipProvider>
  )
}

// Cursor component for showing other users' cursors
interface CollaborativeCursorProps {
  userId: string
  position: { x: number; y: number }
  color: string
  name?: string
}

export function CollaborativeCursor({ position, color, name }: CollaborativeCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.3673L5.29376 16.9273C5.24876 17.4173 5.63676 17.8673 6.13176 17.8673H8.11176C8.36776 17.8673 8.61376 17.7703 8.79376 17.5923L18.1838 8.20227C18.7488 7.63727 18.7488 6.71727 18.1838 6.15227L15.8488 3.81727C15.2838 3.25227 14.3638 3.25227 13.7988 3.81727L4.40876 13.2073C4.23076 13.3873 4.13376 13.6323 4.13376 13.8883L4.13376 15.8683"
          fill={color}
        />
      </svg>
      {name && (
        <div
          className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      )}
    </div>
  )
}