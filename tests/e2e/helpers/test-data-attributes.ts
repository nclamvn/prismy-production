/**
 * Test Data Attributes Helper
 * Centralized management of test IDs for E2E testing
 */

export const TEST_IDS = {
  // Authentication
  emailInput: 'email-input',
  passwordInput: 'password-input',
  loginButton: 'login-button',
  
  // Workspace Layout
  workspaceCanvas: 'workspace-canvas',
  topBar: 'top-bar',
  sideNav: 'side-nav',
  jobSidebar: 'job-sidebar',
  agentPane: 'agent-pane',
  
  // Navigation
  navDocuments: 'nav-documents',
  navUpload: 'nav-upload',
  navBatches: 'nav-batches',
  navTranslate: 'nav-translate',
  navAgent: 'nav-agent',
  navSettings: 'nav-settings',
  
  // Upload System
  enterpriseUpload: 'enterprise-upload',
  fileInput: 'file-input',
  uploadProgress: 'upload-progress',
  uploadSuccess: 'upload-success',
  uploadError: 'upload-error',
  jobId: 'job-id',
  errorMessage: 'error-message',
  resumeUpload: 'resume-upload',
  
  // Job Management
  toggleJobSidebar: 'toggle-job-sidebar',
  jobList: 'job-list',
  jobItem: (jobId: string) => `job-${jobId}`,
  jobStatus: 'job-status',
  jobProgress: 'job-progress',
  progressBar: 'progress-bar',
  
  // Job Phases
  phaseUploading: 'phase-uploading',
  phaseOcr: 'phase-ocr',
  phaseLanguageDetection: 'phase-language-detection',
  phaseTranslation: 'phase-translation',
  phaseRebuilding: 'phase-rebuilding',
  phaseCompleted: 'phase-completed',
  
  // Output Management
  outputFiles: 'output-files',
  outputFile: 'output-file',
  downloadLink: 'download-link',
  downloadButton: 'download-button',
  
  // Batch Processing
  batchDashboard: 'batch-dashboard',
  createBatch: 'create-batch',
  batchCreated: 'batch-created',
  batchItem: 'batch-item',
  batchView: 'batch-view',
  batchDataTable: 'batch-data-table',
  fileRow: 'file-row',
  fileProgress: 'file-progress',
  batchStats: 'batch-stats',
  
  // File Management
  fileGrid: 'file-grid',
  fileList: 'file-list',
  fileCard: 'file-card',
  fileName: 'file-name',
  fileSize: 'file-size',
  fileStatus: 'file-status',
  fileActions: 'file-actions',
  
  // Modals and Dialogs
  modal: 'modal',
  modalClose: 'modal-close',
  confirmDialog: 'confirm-dialog',
  confirmButton: 'confirm-button',
  cancelButton: 'cancel-button',
  
  // Forms
  form: 'form',
  submitButton: 'submit-button',
  resetButton: 'reset-button',
  searchInput: 'search-input',
  filterSelect: 'filter-select',
  
  // Status Indicators
  statusPending: 'status-pending',
  statusProcessing: 'status-processing',
  statusCompleted: 'status-completed',
  statusFailed: 'status-failed',
  statusIdle: 'status-idle',
  
  // Drag and Drop
  dropZone: 'drop-zone',
  dropActive: 'drop-active',
  dragOverlay: 'drag-overlay',
  
  // Real-time Updates
  realtimeStatus: 'realtime-status',
  connectionStatus: 'connection-status',
  lastUpdate: 'last-update',
  
  // Error Handling
  errorBoundary: 'error-boundary',
  errorDetails: 'error-details',
  retryButton: 'retry-button',
  
  // Performance Metrics
  performanceMetrics: 'performance-metrics',
  processingTime: 'processing-time',
  throughput: 'throughput',
  queueSize: 'queue-size'
} as const

export type TestId = typeof TEST_IDS[keyof typeof TEST_IDS] | string

/**
 * Helper function to generate data-testid attributes
 */
export function testId(id: TestId): string {
  return `[data-testid="${id}"]`
}

/**
 * Helper function to create test ID for dynamic elements
 */
export function dynamicTestId(base: string, suffix: string | number): string {
  return `${base}-${suffix}`
}

/**
 * Commonly used test ID patterns
 */
export const TEST_PATTERNS = {
  job: (jobId: string) => TEST_IDS.jobItem(jobId),
  phase: (jobId: string, phase: string) => `job-${jobId}-phase-${phase}`,
  file: (fileId: string) => `file-${fileId}`,
  batch: (batchId: string) => `batch-${batchId}`,
  status: (status: string) => `status-${status}`
} as const