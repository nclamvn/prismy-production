/**
 * Phase 3.8-A: Semantic Insights Panel Component
 * 
 * Interactive component for viewing semantic analysis results and intelligent insights
 * Features concept mapping, relationship visualization, and actionable recommendations
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Network,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Users,
  Zap,
  ArrowRight,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface SemanticInsightsData {
  id: string
  documentContext: {
    domain: string
    subfield?: string
    academicLevel: string
    contentType: string
    complexity: string
    keywords: string[]
    abstractTopics: string[]
  }
  knowledgeDomains: Array<{
    id: string
    name: string
    confidence: number
    coverage: number
    subdomains: string[]
    relatedConcepts: string[]
  }>
  conceptMap: {
    nodes: Array<{
      id: string
      label: string
      type: string
      importance: number
      confidence: number
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      type: string
      strength: number
    }>
    clusters: Array<{
      id: string
      name: string
      nodes: string[]
      coherence: number
      topic: string
    }>
  }
  relationships: Array<{
    id: string
    type: string
    entities: string[]
    description: string
    confidence: number
  }>
  insights: Array<{
    id: string
    type: string
    title: string
    description: string
    significance: number
    implications: string[]
  }>
  recommendations: Array<{
    id: string
    category: string
    priority: string
    action: string
    rationale: string
    expectedImpact: string
    implementationSteps: string[]
  }>
  confidence: number
  processingTime: number
}

interface SemanticInsightsPanelProps {
  insightsData: SemanticInsightsData | null
  isLoading: boolean
  onApplyRecommendation?: (recommendationId: string) => void
  onExploreConceptMap?: () => void
  onFilterInsights?: (filters: any) => void
}

export function SemanticInsightsPanel({
  insightsData,
  isLoading,
  onApplyRecommendation,
  onExploreConceptMap,
  onFilterInsights
}: SemanticInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'insights' | 'recommendations'>('overview')
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [insightFilter, setInsightFilter] = useState<string>('all')

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights)
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId)
    } else {
      newExpanded.add(insightId)
    }
    setExpandedInsights(newExpanded)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-status-success'
    if (confidence >= 0.6) return 'text-status-processing'
    return 'text-status-warning'
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'text-status-success'
      case 'intermediate': return 'text-status-processing'
      case 'advanced': return 'text-status-warning'
      case 'expert': return 'text-red-500'
      default: return 'text-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500'
      case 'high': return 'text-status-warning'
      case 'medium': return 'text-status-processing'
      case 'low': return 'text-status-success'
      default: return 'text-muted'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return TrendingUp
      case 'anomaly': return AlertTriangle
      case 'gap': return Target
      case 'opportunity': return Lightbulb
      case 'verification': return CheckCircle2
      default: return Info
    }
  }

  const filteredInsights = insightsData?.insights.filter(insight => 
    insightFilter === 'all' || insight.type === insightFilter
  ) || []

  const renderOverview = () => {
    if (!insightsData) return null

    return (
      <div className="space-y-6">
        {/* Document Context */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">Document Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary">Domain:</span>
                <span className="capitalize font-medium">{insightsData.documentContext.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Academic Level:</span>
                <span className="capitalize">{insightsData.documentContext.academicLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Content Type:</span>
                <span className="capitalize">{insightsData.documentContext.contentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Complexity:</span>
                <span className={`capitalize font-medium ${getComplexityColor(insightsData.documentContext.complexity)}`}>
                  {insightsData.documentContext.complexity}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary">Analysis Confidence:</span>
                <span className={`font-medium ${getConfidenceColor(insightsData.confidence)}`}>
                  {Math.round(insightsData.confidence * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Processing Time:</span>
                <span>{Math.round(insightsData.processingTime / 1000)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Knowledge Domains:</span>
                <span>{insightsData.knowledgeDomains.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Concepts Identified:</span>
                <span>{insightsData.conceptMap.nodes.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Topics */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">Key Topics & Keywords</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-secondary mb-2">Abstract Topics</h4>
              <div className="flex flex-wrap gap-2">
                {insightsData.documentContext.abstractTopics.map((topic, index) => (
                  <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-secondary mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {insightsData.documentContext.keywords.slice(0, 10).map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-workspace-panel text-muted rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Domains */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">Knowledge Domains</h3>
          <div className="space-y-3">
            {insightsData.knowledgeDomains.map((domain) => (
              <div key={domain.id} className="border border-workspace-divider rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{domain.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getConfidenceColor(domain.confidence)}`}>
                      {Math.round(domain.confidence * 100)}%
                    </span>
                    <span className="text-xs text-muted">
                      Coverage: {Math.round(domain.coverage * 100)}%
                    </span>
                  </div>
                </div>
                
                {domain.subdomains.length > 0 && (
                  <div className="text-sm text-secondary">
                    Subdomains: {domain.subdomains.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <Network className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-semibold">{insightsData.conceptMap.nodes.length}</div>
            <div className="text-sm text-secondary">Concepts</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <ArrowRight className="h-6 w-6 text-status-success mx-auto mb-2" />
            <div className="text-2xl font-semibold">{insightsData.relationships.length}</div>
            <div className="text-sm text-secondary">Relationships</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <Lightbulb className="h-6 w-6 text-status-warning mx-auto mb-2" />
            <div className="text-2xl font-semibold">{insightsData.insights.length}</div>
            <div className="text-sm text-secondary">Insights</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-status-processing mx-auto mb-2" />
            <div className="text-2xl font-semibold">{insightsData.recommendations.length}</div>
            <div className="text-sm text-secondary">Recommendations</div>
          </div>
        </div>
      </div>
    )
  }

  const renderConceptMap = () => {
    if (!insightsData) return null

    return (
      <div className="space-y-6">
        {/* Concept Clusters */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Concept Clusters</h3>
            <Button size="sm" variant="outline" onClick={onExploreConceptMap}>
              <Eye className="h-3 w-3 mr-2" />
              Visualize
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insightsData.conceptMap.clusters.map((cluster) => (
              <div key={cluster.id} className="border border-workspace-divider rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{cluster.name}</span>
                  <span className="text-sm text-muted">
                    Coherence: {Math.round(cluster.coherence * 100)}%
                  </span>
                </div>
                <div className="text-sm text-secondary mb-2">
                  Topic: {cluster.topic}
                </div>
                <div className="text-xs text-muted">
                  {cluster.nodes.length} concepts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Concepts */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-4">Key Concepts</h3>
          <div className="space-y-3">
            {insightsData.conceptMap.nodes
              .sort((a, b) => b.importance - a.importance)
              .slice(0, 10)
              .map((concept) => (
                <div key={concept.id} className="flex items-center justify-between py-2 border-b border-workspace-divider last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      concept.type === 'formula' ? 'bg-status-processing' :
                      concept.type === 'definition' ? 'bg-status-success' :
                      concept.type === 'principle' ? 'bg-status-warning' : 'bg-muted'
                    }`} />
                    <span className="font-medium">{concept.label}</span>
                    <span className="text-xs px-2 py-1 bg-workspace-panel rounded capitalize">
                      {concept.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-status-warning" />
                      <span className="text-xs">{Math.round(concept.importance * 100)}%</span>
                    </div>
                    <span className={`text-xs ${getConfidenceColor(concept.confidence)}`}>
                      {Math.round(concept.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Relationships */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-4">Key Relationships</h3>
          <div className="space-y-3">
            {insightsData.relationships.slice(0, 8).map((relationship) => (
              <div key={relationship.id} className="border border-workspace-divider rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">
                    {relationship.type.replace('_', ' ')}
                  </span>
                  <span className={`text-xs ${getConfidenceColor(relationship.confidence)}`}>
                    {Math.round(relationship.confidence * 100)}%
                  </span>
                </div>
                <div className="text-sm text-secondary mb-2">
                  {relationship.description}
                </div>
                <div className="text-xs text-muted">
                  Entities: {relationship.entities.join(' ↔ ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderInsights = () => {
    if (!insightsData) return null

    return (
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary">Intelligent Insights</h3>
          <select
            value={insightFilter}
            onChange={(e) => setInsightFilter(e.target.value)}
            className="text-sm border border-workspace-divider rounded px-3 py-1 bg-workspace-canvas"
          >
            <option value="all">All Types</option>
            <option value="pattern">Patterns</option>
            <option value="anomaly">Anomalies</option>
            <option value="gap">Knowledge Gaps</option>
            <option value="opportunity">Opportunities</option>
            <option value="verification">Verification</option>
          </select>
        </div>

        {/* Insights List */}
        <div className="space-y-3">
          {filteredInsights.map((insight) => {
            const IconComponent = getInsightIcon(insight.type)
            const isExpanded = expandedInsights.has(insight.id)
            
            return (
              <div key={insight.id} className="bg-workspace-canvas rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleInsightExpansion(insight.id)}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-5 w-5 ${
                      insight.type === 'anomaly' ? 'text-red-500' :
                      insight.type === 'opportunity' ? 'text-status-warning' :
                      insight.type === 'pattern' ? 'text-status-success' :
                      insight.type === 'verification' ? 'text-status-processing' : 'text-muted'
                    }`} />
                    <div>
                      <span className="font-medium">{insight.title}</span>
                      <span className="text-xs ml-2 px-2 py-1 bg-workspace-panel rounded capitalize">
                        {insight.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-status-warning" />
                      <span className="text-xs">{Math.round(insight.significance * 100)}%</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-workspace-divider">
                    <p className="text-sm text-secondary mb-3">{insight.description}</p>
                    
                    {insight.implications.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-primary mb-2">Implications</h5>
                        <ul className="text-sm text-secondary space-y-1">
                          {insight.implications.map((implication, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{implication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderRecommendations = () => {
    if (!insightsData) return null

    const groupedRecommendations = insightsData.recommendations.reduce((groups, rec) => {
      if (!groups[rec.category]) {
        groups[rec.category] = []
      }
      groups[rec.category].push(rec)
      return groups
    }, {} as Record<string, typeof insightsData.recommendations>)

    return (
      <div className="space-y-6">
        {Object.entries(groupedRecommendations).map(([category, recommendations]) => (
          <div key={category} className="bg-workspace-canvas rounded-lg p-4">
            <h3 className="font-semibold text-primary mb-4 capitalize">
              {category.replace('_', ' ')}
            </h3>
            
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="border border-workspace-divider rounded-lg p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{recommendation.action}</span>
                        <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority}
                        </span>
                      </div>
                      <p className="text-sm text-secondary mb-2">{recommendation.rationale}</p>
                      <p className="text-xs text-muted">{recommendation.expectedImpact}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplyRecommendation?.(recommendation.id)}
                    >
                      Apply
                    </Button>
                  </div>
                  
                  {recommendation.implementationSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-workspace-divider">
                      <h5 className="text-sm font-medium text-primary mb-2">Implementation Steps</h5>
                      <ol className="text-sm text-secondary space-y-1">
                        {recommendation.implementationSteps.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 font-medium">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="workspace-panel p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Semantic Analysis</h2>
            <p className="text-sm text-secondary">Analyzing document semantics and generating insights...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-32"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-24"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-40"></div>
        </div>
      </div>
    )
  }

  if (!insightsData) {
    return (
      <div className="workspace-panel p-6">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Semantic Analysis</h3>
          <p className="text-secondary">Process a document to generate intelligent insights and recommendations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-panel">
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-status-success rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Semantic Intelligence</h2>
            <p className="text-sm text-secondary">
              Analysis completed with {Math.round(insightsData.confidence * 100)}% confidence
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-workspace-divider">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'concepts', label: 'Concept Map', icon: Network },
            { id: 'insights', label: 'Insights', icon: Lightbulb, badge: insightsData.insights.length },
            { id: 'recommendations', label: 'Actions', icon: CheckCircle2, badge: insightsData.recommendations.length }
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'concepts' && renderConceptMap()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  )
}