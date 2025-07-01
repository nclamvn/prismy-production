'use client'

export default function WorkspaceSkeleton() {
  return (
    <div
      className="h-screen flex"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Sidebar Skeleton */}
      <div
        className="hidden lg:flex lg:flex-col lg:w-80"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRight: '1px solid var(--surface-outline)',
        }}
      >
        {/* Header Skeleton */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded mr-3 animate-pulse"></div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-200 rounded mt-1 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <div
          className="px-6 py-4 border-b"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--surface-outline)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
