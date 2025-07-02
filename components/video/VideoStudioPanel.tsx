/**
 * Phase 3.9-A: Video Studio Panel Component
 * 
 * Interactive component for prompt-to-video generation with live preview and controls
 * Features video project creation, scene editing, and rendering management
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Square,
  Video,
  Settings,
  Download,
  Film,
  Clock,
  Volume2,
  VolumeX,
  Palette,
  Sliders,
  Target,
  Zap,
  FileVideo,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Star,
  Layers,
  Speaker,
  Image as ImageIcon,
  Type,
  Formula
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface VideoGenerationOptions {
  style: 'educational' | 'presentation' | 'tutorial' | 'explainer'
  duration: 'auto' | 'short' | 'medium' | 'long'
  voiceSettings: {
    enabled: boolean
    voice: 'male' | 'female' | 'neutral'
    speed: number
    language: string
  }
  visualSettings: {
    theme: 'light' | 'dark' | 'academic' | 'modern'
    animations: boolean
    transitions: 'smooth' | 'quick' | 'minimal'
    quality: '720p' | '1080p' | '4k'
  }
  contentSettings: {
    includeFormulas: boolean
    includeTables: boolean
    includeFigures: boolean
    includeNarration: boolean
    showStepByStep: boolean
  }
}

export interface VideoProject {
  id: string
  title: string
  scenes: VideoScene[]
  timeline: VideoTimeline
  metadata: VideoMetadata
}

export interface VideoScene {
  id: string
  type: 'intro' | 'content' | 'formula' | 'table' | 'figure' | 'conclusion'
  duration: number
  startTime: number
  content: {
    title?: string
    text?: string
  }
}

export interface VideoTimeline {
  totalDuration: number
  scenes: Array<{
    sceneId: string
    startTime: number
    endTime: number
  }>
}

export interface VideoMetadata {
  title: string
  description: string
  duration: number
  resolution: string
  createdAt: string
}

export interface VideoGenerationResult {
  success: boolean
  project: VideoProject
  outputFiles: {
    video: string
    thumbnail: string
    subtitles?: string
  }
  statistics: {
    totalScenes: number
    totalDuration: number
    renderingTime: number
    fileSize: number
    quality: string
  }
  error?: string
}

interface VideoStudioPanelProps {
  stemDocument?: any
  semanticAnalysis?: any
  onGenerateVideo?: (options: VideoGenerationOptions) => Promise<VideoGenerationResult>
  onDownloadVideo?: (videoUrl: string) => void
  className?: string
}

export function VideoStudioPanel({
  stemDocument,
  semanticAnalysis,
  onGenerateVideo,
  onDownloadVideo,
  className = ''
}: VideoStudioPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  const [videoProject, setVideoProject] = useState<VideoProject | null>(null)
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'scenes' | 'preview' | 'export'>('settings')
  const [expandedScene, setExpandedScene] = useState<string | null>(null)
  
  const [options, setOptions] = useState<VideoGenerationOptions>({
    style: 'educational',
    duration: 'auto',
    voiceSettings: {
      enabled: true,
      voice: 'neutral',
      speed: 1.0,
      language: 'en'
    },
    visualSettings: {
      theme: 'modern',
      animations: true,
      transitions: 'smooth',
      quality: '1080p'
    },
    contentSettings: {
      includeFormulas: true,
      includeTables: true,
      includeFigures: true,
      includeNarration: true,
      showStepByStep: false
    }
  })

  const handleGenerateVideo = async () => {
    if (!onGenerateVideo) return
    
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus('Initializing video generation...')
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const next = prev + Math.random() * 10
          if (next >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return next
        })
      }, 500)
      
      const result = await onGenerateVideo(options)
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStatus('Video generation completed!')
      
      if (result.success) {
        setVideoResult(result)
        setVideoProject(result.project)
        setActiveTab('preview')
      }
      
    } catch (error) {
      console.error('Video generation failed:', error)
      setGenerationStatus('Video generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSceneIcon = (sceneType: string) => {
    switch (sceneType) {
      case 'intro': return Play
      case 'content': return Type
      case 'formula': return Formula
      case 'table': return Layers
      case 'figure': return ImageIcon
      case 'conclusion': return Square
      default: return Video
    }
  }

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Video Style */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Video Style</h3>
        <div className="grid grid-cols-2 gap-3">
          {['educational', 'presentation', 'tutorial', 'explainer'].map((style) => (
            <button
              key={style}
              onClick={() => setOptions(prev => ({ ...prev, style: style as any }))}
              className={`p-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                options.style === style
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-workspace-divider hover:border-primary/50'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Settings */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Duration</h3>
        <select
          value={options.duration}
          onChange={(e) => setOptions(prev => ({ ...prev, duration: e.target.value as any }))}
          className="w-full p-2 border border-workspace-divider rounded bg-workspace-panel"
        >
          <option value="auto">Auto (Based on content)</option>
          <option value="short">Short (2-5 minutes)</option>
          <option value="medium">Medium (5-10 minutes)</option>
          <option value="long">Long (10-20 minutes)</option>
        </select>
      </div>

      {/* Voice Settings */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Voice Narration</h3>
          <button
            onClick={() => setOptions(prev => ({
              ...prev,
              voiceSettings: { ...prev.voiceSettings, enabled: !prev.voiceSettings.enabled }
            }))}
            className={`w-10 h-6 rounded-full transition-colors ${
              options.voiceSettings.enabled ? 'bg-primary' : 'bg-workspace-divider'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              options.voiceSettings.enabled ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        {options.voiceSettings.enabled && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-secondary">Voice Type</label>
              <select
                value={options.voiceSettings.voice}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  voiceSettings: { ...prev.voiceSettings, voice: e.target.value as any }
                }))}
                className="w-full p-2 border border-workspace-divider rounded bg-workspace-panel"
              >
                <option value="neutral">Neutral</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-secondary">Speed: {options.voiceSettings.speed}x</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={options.voiceSettings.speed}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  voiceSettings: { ...prev.voiceSettings, speed: parseFloat(e.target.value) }
                }))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Visual Settings */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Visual Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-secondary">Theme</label>
            <select
              value={options.visualSettings.theme}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                visualSettings: { ...prev.visualSettings, theme: e.target.value as any }
              }))}
              className="w-full p-2 border border-workspace-divider rounded bg-workspace-panel"
            >
              <option value="modern">Modern</option>
              <option value="academic">Academic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-secondary">Quality</label>
            <select
              value={options.visualSettings.quality}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                visualSettings: { ...prev.visualSettings, quality: e.target.value as any }
              }))}
              className="w-full p-2 border border-workspace-divider rounded bg-workspace-panel"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
              <option value="4k">4K Ultra HD</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Animations</span>
            <button
              onClick={() => setOptions(prev => ({
                ...prev,
                visualSettings: { ...prev.visualSettings, animations: !prev.visualSettings.animations }
              }))}
              className={`w-10 h-6 rounded-full transition-colors ${
                options.visualSettings.animations ? 'bg-primary' : 'bg-workspace-divider'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                options.visualSettings.animations ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Content Inclusion</h3>
        <div className="space-y-2">
          {[
            { key: 'includeFormulas', label: 'Mathematical Formulas' },
            { key: 'includeTables', label: 'Data Tables' },
            { key: 'includeFigures', label: 'Scientific Figures' },
            { key: 'includeNarration', label: 'Voice Narration' },
            { key: 'showStepByStep', label: 'Step-by-Step Explanations' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <button
                onClick={() => setOptions(prev => ({
                  ...prev,
                  contentSettings: {
                    ...prev.contentSettings,
                    [key]: !prev.contentSettings[key as keyof typeof prev.contentSettings]
                  }
                }))}
                className={`w-10 h-6 rounded-full transition-colors ${
                  options.contentSettings[key as keyof typeof options.contentSettings]
                    ? 'bg-primary' : 'bg-workspace-divider'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  options.contentSettings[key as keyof typeof options.contentSettings]
                    ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderScenes = () => {
    if (!videoProject) {
      return (
        <div className="text-center py-8">
          <Film className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-secondary">Generate a video to view scenes</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary">Video Scenes</h3>
          <div className="text-sm text-secondary">
            Total Duration: {formatDuration(videoProject.timeline.totalDuration)}
          </div>
        </div>

        <div className="space-y-3">
          {videoProject.scenes.map((scene, index) => {
            const IconComponent = getSceneIcon(scene.type)
            const isExpanded = expandedScene === scene.id
            
            return (
              <div key={scene.id} className="bg-workspace-canvas rounded-lg p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xs bg-workspace-panel px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    <IconComponent className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-medium capitalize">{scene.type}</span>
                      {scene.content.title && (
                        <div className="text-sm text-secondary">{scene.content.title}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted">
                      {formatDuration(scene.duration)}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                {isExpanded && scene.content.text && (
                  <div className="mt-3 pt-3 border-t border-workspace-divider">
                    <p className="text-sm text-secondary">{scene.content.text}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPreview = () => {
    if (!videoResult) {
      return (
        <div className="text-center py-8">
          <Video className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-secondary">No video preview available</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Video Player Placeholder */}
        <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{videoResult.project.title}</p>
            <p className="text-sm opacity-75">Video Preview Placeholder</p>
            <p className="text-xs opacity-50 mt-2">
              {videoResult.statistics.totalScenes} scenes • {formatDuration(videoResult.statistics.totalDuration)}
            </p>
          </div>
        </div>

        {/* Video Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-workspace-canvas rounded-lg p-3 text-center">
            <Film className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">{videoResult.statistics.totalScenes}</div>
            <div className="text-xs text-secondary">Scenes</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-3 text-center">
            <Clock className="h-5 w-5 text-status-success mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatDuration(videoResult.statistics.totalDuration)}</div>
            <div className="text-xs text-secondary">Duration</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-3 text-center">
            <Zap className="h-5 w-5 text-status-warning mx-auto mb-2" />
            <div className="text-lg font-semibold">{Math.round(videoResult.statistics.renderingTime / 1000)}s</div>
            <div className="text-xs text-secondary">Render Time</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-3 text-center">
            <FileVideo className="h-5 w-5 text-status-processing mx-auto mb-2" />
            <div className="text-lg font-semibold">{videoResult.statistics.quality}</div>
            <div className="text-xs text-secondary">Quality</div>
          </div>
        </div>
      </div>
    )
  }

  const renderExport = () => {
    if (!videoResult) {
      return (
        <div className="text-center py-8">
          <Download className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-secondary">Generate a video to export</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">Export Options</h3>
          
          <div className="space-y-4">
            <Button
              onClick={() => onDownloadVideo?.(videoResult.outputFiles.video)}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Video ({videoResult.statistics.quality})
            </Button>
            
            {videoResult.outputFiles.subtitles && (
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Subtitles (SRT)
              </Button>
            )}
            
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Thumbnail
            </Button>
          </div>
        </div>

        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">Project Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">File Size:</span>
              <span>{(videoResult.statistics.fileSize / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Resolution:</span>
              <span>{videoResult.project.metadata.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Frame Rate:</span>
              <span>{videoResult.project.metadata.frameRate} fps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Created:</span>
              <span>{new Date(videoResult.project.metadata.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`workspace-panel ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-status-warning rounded-lg flex items-center justify-center">
            <Video className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Prompt-to-Video Studio</h2>
            <p className="text-sm text-secondary">
              Transform your document into an educational video
            </p>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="p-6 border-b border-workspace-divider">
          <div className="flex items-center space-x-3 mb-3">
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            <span className="font-medium text-primary">Generating Video</span>
            <span className="text-sm text-secondary">{Math.round(generationProgress)}%</span>
          </div>
          <div className="w-full bg-workspace-divider rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-sm text-secondary mt-2">{generationStatus}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-workspace-divider">
        <div className="flex">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'scenes', label: 'Scenes', icon: Layers, badge: videoProject?.scenes.length },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'export', label: 'Export', icon: Download }
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-status-processing text-white text-xs px-2 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'scenes' && renderScenes()}
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'export' && renderExport()}
      </div>

      {/* Footer */}
      {activeTab === 'settings' && (
        <div className="p-6 border-t border-workspace-divider">
          <Button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !stemDocument}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
          
          {!stemDocument && (
            <p className="text-xs text-secondary text-center mt-2">
              Process a document first to enable video generation
            </p>
          )}
        </div>
      )}
    </div>
  )
}