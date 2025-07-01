/**
 * PRISMY CROSS-DOCUMENT INTELLIGENCE COMPONENT
 * Advanced multi-document analysis and knowledge synthesis interface
 * Displays document clusters, relationships, and cross-document insights
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  FileStack,
  Search,
  Brain,
  Lightbulb,
  Share2,
  AlertTriangle,
  TrendingUp,
  Eye,
  Filter,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Zap
} from 'lucide-react'
import {
  DocumentCluster,
  CrossDocumentInsight,
  KnowledgeGraph,
  MultiDocumentQuery
} from '@/lib/agents/intelligence/cross-document-intelligence'

interface CrossDocumentIntelligenceProps {
  onAnalysisComplete?: (analysis: any) => void
  onQuerySubmit?: (query: MultiDocumentQuery, result: any) => void
}

export default function CrossDocumentIntelligence({ 
  onAnalysisComplete, 
  onQuerySubmit 
}: CrossDocumentIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'insights' | 'knowledge' | 'query'>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [analysis, setAnalysis] = useState<any>(null)
  const [clusters, setClusters] = useState<DocumentCluster[]>([])
  const [insights, setInsights] = useState<CrossDocumentInsight[]>([])
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)
  
  // Query states
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  
  // UI states
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  useEffect(() => {
    loadCachedData()
  }, [])

  const loadCachedData = async () => {
    try {
      const [clustersResponse, insightsResponse, graphResponse] = await Promise.all([
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_document_clusters' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_cross_document_insights' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_knowledge_graph' })
        })
      ])

      if (clustersResponse.ok) {
        const clustersData = await clustersResponse.json()
        setClusters(clustersData.data || [])
      }

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.data || [])
      }

      if (graphResponse.ok) {
        const graphData = await graphResponse.json()
        setKnowledgeGraph(graphData.data)
      }

    } catch (err) {
      console.error('Failed to load cached data:', err)
    }
  }

  const runFullAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_all_documents' })
      })

      if (response.ok) {
        const result = await response.json()
        const analysisData = result.data

        setAnalysis(analysisData)
        setClusters(analysisData.clusters || [])
        setInsights(analysisData.insights || [])
        setKnowledgeGraph(analysisData.knowledgeGraph)
        
        onAnalysisComplete?.(analysisData)
      } else {
        setError('Failed to run cross-document analysis')
      }
    } catch (err) {
      setError('Error running analysis')
      console.error('Analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuerySubmit = async () => {
    if (!query.trim()) return

    try {
      setQueryLoading(true)
      
      const multiDocQuery: MultiDocumentQuery = {
        query: query.trim(),
        documentScope: 'all',
        analysisType: 'comprehensive',
        includeRelationships: true,
        includeTimeline: true
      }

      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'query_across_documents',
          ...multiDocQuery
        })
      })

      if (response.ok) {
        const result = await response.json()
        setQueryResult(result.data)
        onQuerySubmit?.(multiDocQuery, result.data)
      } else {
        setError('Query failed')
      }
    } catch (err) {
      setError('Query error')
      console.error('Query failed:', err)
    } finally {
      setQueryLoading(false)
    }
  }

  const getInsightIcon = (type: CrossDocumentInsight['type']) => {
    switch (type) {
      case 'pattern_discovery': return <TrendingUp className="w-5 h-5" />
      case 'knowledge_synthesis': return <Brain className="w-5 h-5" />
      case 'gap_analysis': return <AlertTriangle className="w-5 h-5" />
      case 'contradiction_detection': return <Share2 className="w-5 h-5" />
      case 'trend_analysis': return <TrendingUp className="w-5 h-5" />
      default: return <Lightbulb className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">Cross-Document Intelligence Error</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={loadCachedData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Network className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cross-Document Intelligence
            </h3>
            <p className="text-sm text-gray-600">
              Multi-document analysis and knowledge synthesis
            </p>
          </div>
        </div>
        
        <button 
          onClick={runFullAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Analysis</span>
        </button>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <h4 className="font-semibold text-gray-900 mb-4">Analysis Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{analysis.summary.totalDocuments}</div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.summary.clustersFound}</div>
              <div className="text-sm text-gray-600">Clusters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.summary.insightsGenerated}</div>
              <div className="text-sm text-gray-600">Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(analysis.summary.analysisQuality * 100)}%
              </div>
              <div className="text-sm text-gray-600">Quality</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'clusters', label: 'Clusters', icon: FileStack },
            { key: 'insights', label: 'Insights', icon: Lightbulb },
            { key: 'knowledge', label: 'Knowledge Graph', icon: Network },
            { key: 'query', label: 'Query', icon: Search }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {clusters.length === 0 && insights.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Network className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No Cross-Document Analysis Yet
                </h4>
                <p className="text-gray-600 mb-6">
                  Run a comprehensive analysis to discover patterns and relationships across your documents.
                </p>
                <button 
                  onClick={runFullAnalysis}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Analysis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Document Clusters:</span>
                      <span className="font-medium">{clusters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cross-Document Insights:</span>
                      <span className="font-medium">{insights.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Knowledge Concepts:</span>
                      <span className="font-medium">{knowledgeGraph?.nodes.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Concept Relationships:</span>
                      <span className="font-medium">{knowledgeGraph?.edges.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Insights Preview */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Insights</h4>
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="flex items-start space-x-3">
                        <div className="text-indigo-600 mt-1">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {insight.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {Math.round(insight.confidence * 100)}% confidence
                          </p>
                        </div>
                      </div>
                    ))}
                    {insights.length === 0 && (
                      <p className="text-sm text-gray-500">No insights generated yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clusters Tab */}
        {activeTab === 'clusters' && (
          <div className="space-y-4">
            {clusters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileStack className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No document clusters found</p>
                <p className="text-sm">Run analysis to discover document groupings</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clusters.map((cluster) => (
                  <motion.div
                    key={cluster.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cluster.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{cluster.theme}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {cluster.documents.length} documents
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {cluster.keyTopics.map((topic, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Confidence: {Math.round(cluster.confidence * 100)}%
                        </span>
                        <button
                          onClick={() => setSelectedCluster(
                            selectedCluster === cluster.id ? null : cluster.id
                          )}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          {selectedCluster === cluster.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedCluster === cluster.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-100"
                        >
                          <h5 className="font-medium text-gray-900 mb-2">Documents in Cluster:</h5>
                          <div className="space-y-2">
                            {cluster.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center space-x-3 text-sm">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{doc.title}</span>
                                <span className="text-gray-500">({doc.type})</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No cross-document insights available</p>
                <p className="text-sm">Run analysis to generate insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-3 flex-1">
                        <div className="flex-shrink-0 pt-1">
                          {getInsightIcon(insight.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {insight.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                            <span>{Math.round(insight.confidence * 100)}% confidence</span>
                            <span>{insight.involvedDocuments.length} documents</span>
                            <span className="capitalize">{insight.priority} priority</span>
                          </div>

                          {/* Recommendations */}
                          {insight.recommendations.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-900 mb-1">Recommendations:</h5>
                              <ul className="space-y-1">
                                {insight.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                                    <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setExpandedInsight(
                          expandedInsight === insight.id ? null : insight.id
                        )}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors ml-4"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedInsight === insight.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Evidence:</h6>
                              <ul className="space-y-1">
                                {insight.evidence.patterns.map((pattern, index) => (
                                  <li key={index} className="text-gray-700">• {pattern}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Quality Score:</h6>
                              <div className="text-gray-700">
                                {Math.round(insight.metadata.qualityScore * 100)}% 
                                <span className="text-gray-500 ml-2">
                                  (processed in {insight.metadata.processingTime}ms)
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Knowledge Graph Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {!knowledgeGraph || knowledgeGraph.nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No knowledge graph available</p>
                <p className="text-sm">Run analysis to build knowledge connections</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Knowledge Graph Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{knowledgeGraph.nodes.length}</div>
                    <div className="text-sm text-gray-600">Concepts</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{knowledgeGraph.edges.length}</div>
                    <div className="text-sm text-gray-600">Relationships</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{knowledgeGraph.clusters.length}</div>
                    <div className="text-sm text-gray-600">Clusters</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{knowledgeGraph.centralConcepts.length}</div>
                    <div className="text-sm text-gray-600">Central Concepts</div>
                  </div>
                </div>

                {/* Central Concepts */}
                {knowledgeGraph.centralConcepts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Central Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {knowledgeGraph.centralConcepts.map((concept, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Knowledge Clusters */}
                {knowledgeGraph.clusters.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Knowledge Clusters</h4>
                    <div className="space-y-4">
                      {knowledgeGraph.clusters.map((cluster) => (
                        <div key={cluster.id} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{cluster.name}</h5>
                            <span className="text-sm text-gray-500">
                              {Math.round(cluster.coherence * 100)}% coherence
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cluster.concepts.map((concept, index) => (
                              <span 
                                key={index}
                                className={`px-2 py-1 text-xs rounded ${
                                  concept === cluster.centralConcept 
                                    ? 'bg-purple-100 text-purple-800 font-medium' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Query Tab */}
        {activeTab === 'query' && (
          <div className="space-y-6">
            {/* Query Interface */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Query Across Documents</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
                      placeholder="Ask a question that spans multiple documents..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleQuerySubmit}
                      disabled={!query.trim() || queryLoading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {queryLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Query</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Query Results */}
            {queryResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h4 className="font-semibold text-gray-900 mb-4">Query Results</h4>
                
                <div className="space-y-4">
                  {/* Answer */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Answer:</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{queryResult.answer}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        Confidence: {Math.round(queryResult.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Supporting Evidence */}
                  {queryResult.supportingEvidence && queryResult.supportingEvidence.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Supporting Evidence:</h5>
                      <div className="space-y-2">
                        {queryResult.supportingEvidence.map((evidence: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-blue-900">{evidence.title}</div>
                              <div className="text-sm text-blue-700 mt-1">
                                {evidence.relevantSections.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {queryResult.recommendations && queryResult.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Recommendations:</h5>
                      <ul className="space-y-1">
                        {queryResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-900 font-medium">Running cross-document analysis...</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}