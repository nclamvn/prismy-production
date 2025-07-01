import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface ProgressStep {
  id: string
  label: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number // 0-100
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep?: string
  className?: string
  variant?: 'vertical' | 'horizontal'
  showProgress?: boolean
}

export function ProgressIndicator({
  steps,
  currentStep,
  className,
  variant = 'vertical',
  showProgress = true,
}: ProgressIndicatorProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-accent animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepStyles = (step: ProgressStep, index: number) => {
    const isActive = currentStep === step.id
    const isCompleted = step.status === 'completed'
    const isError = step.status === 'error'
    const isProcessing = step.status === 'processing'

    return {
      container: cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
        isActive && 'bg-gray-50 border border-gray-200',
        isCompleted && 'bg-green-50',
        isError && 'bg-red-50',
        isProcessing && 'bg-blue-50'
      ),
      content: cn(
        'flex-1 min-w-0',
        isActive && 'text-gray-900',
        isCompleted && 'text-green-900',
        isError && 'text-red-900',
        isProcessing && 'text-blue-900'
      ),
      label: cn(
        'text-sm font-medium',
        step.status === 'pending' && 'text-gray-500'
      ),
      description: cn(
        'text-xs mt-1',
        isActive && 'text-gray-600',
        isCompleted && 'text-green-700',
        isError && 'text-red-700',
        isProcessing && 'text-blue-700',
        step.status === 'pending' && 'text-gray-400'
      ),
    }
  }

  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-4 overflow-x-auto pb-2', className)}>
        {steps.map((step, index) => {
          const styles = getStepStyles(step, index)
          
          return (
            <React.Fragment key={step.id}>
              <div className={cn('flex items-center gap-2 flex-shrink-0', styles.container)}>
                {getStepIcon(step)}
                <div className={styles.content}>
                  <div className={styles.label}>{step.label}</div>
                  {step.description && (
                    <div className={styles.description}>{step.description}</div>
                  )}
                  {showProgress && step.progress !== undefined && step.status === 'processing' && (
                    <div className="mt-1">
                      <div className="w-20 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-accent h-1 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 flex-shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step, index) => {
        const styles = getStepStyles(step, index)
        
        return (
          <div key={step.id} className="relative">
            <div className={styles.container}>
              {getStepIcon(step)}
              <div className={styles.content}>
                <div className={styles.label}>{step.label}</div>
                {step.description && (
                  <div className={styles.description}>{step.description}</div>
                )}
                {showProgress && step.progress !== undefined && step.status === 'processing' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{step.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Connection line for vertical layout */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-12 w-px h-4 bg-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Real-time progress hook
export function useRealTimeProgress(jobId?: string) {
  const [steps, setSteps] = React.useState<ProgressStep[]>([])
  const [currentStep, setCurrentStep] = React.useState<string>()
  const [isComplete, setIsComplete] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!jobId) return

    let eventSource: EventSource | null = null

    const connectToProgressStream = () => {
      eventSource = new EventSource(`/api/progress/${jobId}`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'progress') {
            setSteps(data.steps)
            setCurrentStep(data.currentStep)
          } else if (data.type === 'complete') {
            setIsComplete(true)
            setSteps(data.steps)
          } else if (data.type === 'error') {
            setError(data.error)
          }
        } catch (error) {
          console.error('Failed to parse progress data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Progress stream error:', error)
        eventSource?.close()
        
        // Retry connection after 3 seconds
        setTimeout(connectToProgressStream, 3000)
      }
    }

    connectToProgressStream()

    return () => {
      eventSource?.close()
    }
  }, [jobId])

  return {
    steps,
    currentStep,
    isComplete,
    error,
  }
}