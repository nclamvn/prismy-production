'use client'

/**
 * Visual Workflow Builder Component
 * Drag-and-drop interface for creating automation workflows
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PlusIcon, PlayIcon, SaveIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from '@/lib/i18n/provider'
import { logger } from '@/lib/logger'

interface WorkflowBuilderProps {
  workflowId?: string
  initialWorkflow?: any
  onSave?: (workflow: any) => void
  onExecute?: (workflow: any) => void
  readOnly?: boolean
}

// Custom node types
const TriggerNode = ({ data }: { data: any }) => {
  const { t } = useTranslation('common')
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-500">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
        <div>
          <div className="text-sm font-bold text-blue-800">{data.label}</div>
          <div className="text-xs text-blue-600">{data.type}</div>
        </div>
      </div>
    </div>
  )
}

const ActionNode = ({ data }: { data: any }) => {
  const { t } = useTranslation('common')
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-500">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
        <div>
          <div className="text-sm font-bold text-green-800">{data.label}</div>
          <div className="text-xs text-green-600">{data.type}</div>
        </div>
      </div>
    </div>
  )
}

const ConditionNode = ({ data }: { data: any }) => {
  const { t } = useTranslation('common')
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 border-orange-500">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
        <div>
          <div className="text-sm font-bold text-orange-800">{data.label}</div>
          <div className="text-xs text-orange-600">Condition</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export function WorkflowBuilder({
  workflowId,
  initialWorkflow,
  onSave,
  onExecute,
  readOnly = false
}: WorkflowBuilderProps) {
  const { t } = useTranslation('common')
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '')
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (!readOnly) {
      setSelectedNode(node)
      setIsConfigPanelOpen(true)
    }
  }, [readOnly])

  const addNode = useCallback((type: 'trigger' | 'action' | 'condition') => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data: {
        label: `New ${type}`,
        type: type,
        config: {}
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNode(null)
    setIsConfigPanelOpen(false)
  }, [setNodes, setEdges])

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    )
  }, [setNodes])

  const saveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    try {
      const workflow = {
        name: workflowName,
        description: workflowDescription,
        triggers: nodes.filter(node => node.type === 'trigger').map(node => ({
          id: node.id,
          type: node.data.config.triggerType || 'manual',
          conditions: node.data.config.conditions || {},
          enabled: true
        })),
        actions: nodes.filter(node => node.type === 'action').map((node, index) => ({
          id: node.id,
          type: node.data.config.actionType || 'notify',
          config: node.data.config || {},
          order: index + 1,
          conditional: node.data.config.conditional
        })),
        enabled: true,
        priority: 0,
        metadata: {
          nodes,
          edges,
          layout: 'reactflow'
        }
      }

      onSave?.(workflow)
      logger.info('Workflow saved', { workflowName, nodeCount: nodes.length })
    } catch (error) {
      logger.error('Failed to save workflow', { error })
      alert('Failed to save workflow')
    }
  }, [workflowName, workflowDescription, nodes, edges, onSave])

  const executeWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      alert('Please add some nodes to the workflow first')
      return
    }

    const workflow = {
      name: workflowName,
      triggers: nodes.filter(node => node.type === 'trigger'),
      actions: nodes.filter(node => node.type === 'action'),
      metadata: { nodes, edges }
    }

    onExecute?.(workflow)
  }, [workflowName, nodes, edges, onExecute])

  const triggerOptions = [
    { value: 'document_upload', label: 'Document Upload' },
    { value: 'translation_complete', label: 'Translation Complete' },
    { value: 'schedule', label: 'Schedule' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'manual', label: 'Manual' }
  ]

  const actionOptions = [
    { value: 'translate', label: 'Translate Document' },
    { value: 'analyze', label: 'AI Analysis' },
    { value: 'notify', label: 'Send Notification' },
    { value: 'export', label: 'Export Document' },
    { value: 'webhook', label: 'Call Webhook' },
    { value: 'ai_process', label: 'AI Processing' },
    { value: 'approval', label: 'Approval Request' }
  ]

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
              disabled={readOnly}
            />
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Description (optional)"
              className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              disabled={readOnly}
            />
          </div>
          
          <div className="flex space-x-2">
            {!readOnly && (
              <>
                <button
                  onClick={() => addNode('trigger')}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Trigger
                </button>
                
                <button
                  onClick={() => addNode('action')}
                  className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Action
                </button>
                
                <button
                  onClick={() => addNode('condition')}
                  className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Condition
                </button>
              </>
            )}
            
            <button
              onClick={executeWorkflow}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlayIcon className="w-4 h-4 mr-1" />
              {t('buttons.execute')}
            </button>
            
            {!readOnly && (
              <button
                onClick={saveWorkflow}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <SaveIcon className="w-4 h-4 mr-1" />
                {t('buttons.save')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {/* Configuration Panel */}
        {isConfigPanelOpen && selectedNode && !readOnly && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Configure Node</h3>
              <button
                onClick={() => setIsConfigPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedNode.type === 'trigger' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Type
                  </label>
                  <select
                    value={selectedNode.data.config?.triggerType || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { 
                      config: { ...selectedNode.data.config, triggerType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select trigger type</option>
                    {triggerOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={selectedNode.data.config?.actionType || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { 
                      config: { ...selectedNode.data.config, actionType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select action type</option>
                    {actionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration (JSON)
                </label>
                <textarea
                  value={JSON.stringify(selectedNode.data.config || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value)
                      updateNodeData(selectedNode.id, { config })
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="{}"
                />
              </div>

              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}