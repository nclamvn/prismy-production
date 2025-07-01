export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-default flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent-brand/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary">Loading Workspace</h2>
          <p className="text-sm text-muted mt-1">Preparing your documents...</p>
        </div>
      </div>
    </div>
  )
}