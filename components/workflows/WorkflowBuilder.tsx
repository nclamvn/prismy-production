'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Save, 
  Play, 
  Settings, 
  Trash2, 
  Copy, 
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  MousePointer,
  Hand,
  Square,
  Circle,
  ArrowRight,
  GitBranch,
  Clock,
  Webhook,
  Brain,
  FileText,
  Calculator,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'
import { OperationOptimizer } from '@/lib/performance-optimizer'

interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'agent' | 'condition' | 'action' | 'delay' | 'webhook' | 'loop'
  name: string
  description: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  config: Record<string, any>
  inputs: NodePort[]
  outputs: NodePort[]
  status?: 'idle' | 'running' | 'completed' | 'error'
}

interface NodePort {
  id: string
  type: 'input' | 'output'
  name: string
  dataType: 'any' | 'string' | 'number' | 'boolean' | 'file' | 'object'
  position: { x: number, y: number }
}

interface WorkflowConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
  path: string
}

interface WorkflowBuilderProps {
  language?: 'vi' | 'en'
  initialWorkflow?: {
    nodes: WorkflowNode[]
    connections: WorkflowConnection[]
  }
  onSave?: (workflow: { nodes: WorkflowNode[], connections: WorkflowConnection[] }) => void
  onTest?: (workflow: { nodes: WorkflowNode[], connections: WorkflowConnection[] }) => void
}

export default function WorkflowBuilder({
  language = 'en',
  initialWorkflow,
  onSave,
  onTest
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'hand' | 'connect'>('select')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, portId: string } | null>(null)
  const [showNodePalette, setShowNodePalette] = useState(true)
  const [workflowName, setWorkflowName] = useState('Untitled Workflow')
  const [isSaved, setIsSaved] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const content = {
    vi: {
      title: 'Workflow Builder',
      subtitle: 'Tạo và chỉnh sửa workflows tự động',
      tools: {
        select: 'Chọn',
        hand: 'Di chuyển',
        connect: 'Kết nối'
      },
      nodeTypes: {
        start: 'Bắt đầu',
        end: 'Kết thúc',
        agent: 'AI Agent',
        condition: 'Điều kiện',
        action: 'Hành động',
        delay: 'Chờ đợi',
        webhook: 'Webhook',
        loop: 'Lặp lại'
      },
      actions: {
        save: 'Lưu',
        test: 'Kiểm tra',
        run: 'Chạy',
        export: 'Xuất',
        import: 'Nhập',
        undo: 'Hoàn tác',
        redo: 'Làm lại',
        delete: 'Xóa',
        copy: 'Sao chép',
        paste: 'Dán',
        clear: 'Xóa tất cả'
      },
      palette: {
        title: 'Node Palette',
        search: 'Tìm kiếm nodes...',
        categories: {
          triggers: 'Kích hoạt',
          agents: 'AI Agents',
          logic: 'Logic',
          actions: 'Hành động',
          integrations: 'Tích hợp'
        }
      },
      properties: {
        title: 'Thuộc tính',
        name: 'Tên',
        description: 'Mô tả',
        config: 'Cấu hình'
      },
      status: {
        idle: 'Chờ',
        running: 'Đang chạy',
        completed: 'Hoàn thành',
        error: 'Lỗi'
      }
    },
    en: {
      title: 'Workflow Builder',
      subtitle: 'Create and edit automation workflows',
      tools: {
        select: 'Select',
        hand: 'Pan',
        connect: 'Connect'
      },
      nodeTypes: {
        start: 'Start',
        end: 'End',
        agent: 'AI Agent',
        condition: 'Condition',
        action: 'Action',
        delay: 'Delay',
        webhook: 'Webhook',
        loop: 'Loop'
      },
      actions: {
        save: 'Save',
        test: 'Test',
        run: 'Run',
        export: 'Export',
        import: 'Import',
        undo: 'Undo',
        redo: 'Redo',
        delete: 'Delete',
        copy: 'Copy',
        paste: 'Paste',
        clear: 'Clear All'
      },
      palette: {
        title: 'Node Palette',
        search: 'Search nodes...',
        categories: {
          triggers: 'Triggers',
          agents: 'AI Agents',
          logic: 'Logic',
          actions: 'Actions',
          integrations: 'Integrations'
        }
      },
      properties: {
        title: 'Properties',
        name: 'Name',
        description: 'Description',
        config: 'Configuration'
      },
      status: {
        idle: 'Idle',
        running: 'Running',
        completed: 'Completed',
        error: 'Error'
      }
    }
  }

  // Initialize workflow
  useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes)
      setConnections(initialWorkflow.connections)
    } else {
      // Create default start and end nodes
      const startNode: WorkflowNode = {
        id: 'start',
        type: 'start',
        name: content[language].nodeTypes.start,
        description: 'Workflow starting point',
        position: { x: 100, y: 200 },
        size: { width: 120, height: 60 },
        config: {},
        inputs: [],
        outputs: [
          {
            id: 'start-output',
            type: 'output',
            name: 'Start',
            dataType: 'any',
            position: { x: 120, y: 30 }
          }
        ]
      }

      const endNode: WorkflowNode = {
        id: 'end',
        type: 'end',
        name: content[language].nodeTypes.end,
        description: 'Workflow ending point',
        position: { x: 500, y: 200 },
        size: { width: 120, height: 60 },
        config: {},
        inputs: [
          {
            id: 'end-input',
            type: 'input',
            name: 'End',
            dataType: 'any',
            position: { x: 0, y: 30 }
          }
        ],
        outputs: []
      }

      setNodes([startNode, endNode])
    }
  }, [initialWorkflow, language])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      // Set canvas size
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Apply zoom and pan
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Draw grid
      drawGrid(ctx, rect.width, rect.height)

      // Draw connections
      connections.forEach(connection => {
        drawConnection(ctx, connection)
      })

      // Draw nodes
      nodes.forEach(node => {
        drawNode(ctx, node)
      })

      ctx.restore()
    }

    const optimizedRender = OperationOptimizer.throttle('canvas-render', render, 16)
    optimizedRender()

    animationFrameRef.current = requestAnimationFrame(() => {
      optimizedRender()
    })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [nodes, connections, zoom, pan, selectedNodes, selectedConnection])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5

    for (let x = 0; x <= width / zoom; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height / zoom)
      ctx.stroke()
    }

    for (let y = 0; y <= height / zoom; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width / zoom, y)
      ctx.stroke()
    }
  }

  const drawNode = (ctx: CanvasRenderingContext2D, node: WorkflowNode) => {
    const { x, y } = node.position
    const { width, height } = node.size
    const isSelected = selectedNodes.has(node.id)

    // Node background
    ctx.fillStyle = getNodeColor(node.type)
    ctx.fillRect(x, y, width, height)

    // Node border
    ctx.strokeStyle = isSelected ? '#3B82F6' : '#D1D5DB'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.strokeRect(x, y, width, height)

    // Node icon and text
    ctx.fillStyle = '#1F2937'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(node.name, x + width / 2, y + height / 2 + 4)

    // Status indicator
    if (node.status) {
      const statusColor = getStatusColor(node.status)
      ctx.fillStyle = statusColor
      ctx.beginPath()
      ctx.arc(x + width - 8, y + 8, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw ports
    node.inputs.forEach(port => {
      drawPort(ctx, { x: x + port.position.x, y: y + port.position.y }, 'input')
    })

    node.outputs.forEach(port => {
      drawPort(ctx, { x: x + port.position.x, y: y + port.position.y }, 'output')
    })
  }

  const drawPort = (ctx: CanvasRenderingContext2D, position: { x: number, y: number }, type: 'input' | 'output') => {
    ctx.fillStyle = type === 'input' ? '#10B981' : '#3B82F6'
    ctx.beginPath()
    ctx.arc(position.x, position.y, 4, 0, 2 * Math.PI)
    ctx.fill()

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: WorkflowConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId)
    const toNode = nodes.find(n => n.id === connection.toNodeId)
    
    if (!fromNode || !toNode) return

    const fromPort = fromNode.outputs.find(p => p.id === connection.fromPortId)
    const toPort = toNode.inputs.find(p => p.id === connection.toPortId)

    if (!fromPort || !toPort) return

    const startX = fromNode.position.x + fromPort.position.x
    const startY = fromNode.position.y + fromPort.position.y
    const endX = toNode.position.x + toPort.position.x
    const endY = toNode.position.y + toPort.position.y

    // Draw curved connection
    ctx.strokeStyle = selectedConnection === connection.id ? '#3B82F6' : '#6B7280'
    ctx.lineWidth = selectedConnection === connection.id ? 2 : 1
    ctx.beginPath()
    ctx.moveTo(startX, startY)

    const controlX1 = startX + 50
    const controlY1 = startY
    const controlX2 = endX - 50
    const controlY2 = endY

    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY)
    ctx.stroke()

    // Draw arrow
    const angle = Math.atan2(endY - controlY2, endX - controlX2)
    const arrowLength = 8
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  const getNodeColor = (type: string) => {
    const colors = {
      start: '#10B981',
      end: '#EF4444',
      agent: '#8B5CF6',
      condition: '#F59E0B',
      action: '#3B82F6',
      delay: '#6B7280',
      webhook: '#EC4899',
      loop: '#14B8A6'
    }
    return colors[type as keyof typeof colors] || '#6B7280'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      idle: '#6B7280',
      running: '#3B82F6',
      completed: '#10B981',
      error: '#EF4444'
    }
    return colors[status as keyof typeof colors] || '#6B7280'
  }

  const getNodeIcon = (type: string) => {
    const icons = {
      start: <Play className="w-4 h-4" />,
      end: <Square className="w-4 h-4" />,
      agent: <Brain className="w-4 h-4" />,
      condition: <GitBranch className="w-4 h-4" />,
      action: <Settings className="w-4 h-4" />,
      delay: <Clock className="w-4 h-4" />,
      webhook: <Webhook className="w-4 h-4" />,
      loop: <Circle className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <Square className="w-4 h-4" />
  }

  const handleNodeDrop = useCallback((event: React.DragEvent, nodeType: string) => {
    event.preventDefault()
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (event.clientX - rect.left - pan.x) / zoom
    const y = (event.clientY - rect.top - pan.y) / zoom

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: nodeType as any,
      name: content[language].nodeTypes[nodeType as keyof typeof content[typeof language]['nodeTypes']],
      description: `${nodeType} node`,
      position: { x: x - 60, y: y - 30 },
      size: { width: 120, height: 60 },
      config: {},
      inputs: nodeType !== 'start' ? [{
        id: `input-${Date.now()}`,
        type: 'input',
        name: 'Input',
        dataType: 'any',
        position: { x: 0, y: 30 }
      }] : [],
      outputs: nodeType !== 'end' ? [{
        id: `output-${Date.now()}`,
        type: 'output',
        name: 'Output',
        dataType: 'any',
        position: { x: 120, y: 30 }
      }] : []
    }

    setNodes(prev => [...prev, newNode])
    setIsSaved(false)
  }, [pan, zoom, language])

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (event.clientX - rect.left - pan.x) / zoom
    const y = (event.clientY - rect.top - pan.y) / zoom

    // Check if clicking on a node
    const clickedNode = nodes.find(node => 
      x >= node.position.x && 
      x <= node.position.x + node.size.width &&
      y >= node.position.y && 
      y <= node.position.y + node.size.height
    )

    if (clickedNode) {
      if (tool === 'select') {
        setSelectedNodes(new Set([clickedNode.id]))
        setDraggedNode(clickedNode.id)
        setDragOffset({
          x: x - clickedNode.position.x,
          y: y - clickedNode.position.y
        })
        setIsDragging(true)
      }
    } else {
      setSelectedNodes(new Set())
      setSelectedConnection(null)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !draggedNode) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (event.clientX - rect.left - pan.x) / zoom
    const y = (event.clientY - rect.top - pan.y) / zoom

    setNodes(prev => prev.map(node => 
      node.id === draggedNode
        ? {
            ...node,
            position: {
              x: x - dragOffset.x,
              y: y - dragOffset.y
            }
          }
        : node
    ))
    setIsSaved(false)
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setDraggedNode(null)
  }

  const handleSave = () => {
    const workflow = { nodes, connections }
    onSave?.(workflow)
    setIsSaved(true)
    console.log('Workflow saved:', workflow)
  }

  const handleTest = () => {
    const workflow = { nodes, connections }
    onTest?.(workflow)
    setIsRunning(true)
    
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false)
    }, 3000)
  }

  const handleDeleteSelected = () => {
    setNodes(prev => prev.filter(node => !selectedNodes.has(node.id)))
    setConnections(prev => prev.filter(conn => 
      !selectedNodes.has(conn.fromNodeId) && !selectedNodes.has(conn.toNodeId)
    ))
    setSelectedNodes(new Set())
    setIsSaved(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const nodeTemplates = [
    { type: 'agent', category: 'agents' },
    { type: 'condition', category: 'logic' },
    { type: 'action', category: 'actions' },
    { type: 'delay', category: 'logic' },
    { type: 'webhook', category: 'integrations' },
    { type: 'loop', category: 'logic' }
  ]

  return (
    <OptimizedComponentWrapper
      componentId="workflow-builder"
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
    >
      <div className="flex h-full bg-gray-50">
        {/* Node Palette */}
        <AnimatePresence>
          {showNodePalette && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-80 bg-white border-r border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{content[language].palette.title}</h3>
                <input
                  type="text"
                  placeholder={content[language].palette.search}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {Object.entries(content[language].palette.categories).map(([category, label]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
                      <div className="space-y-2">
                        {nodeTemplates
                          .filter(template => template.category === category)
                          .map(template => (
                            <div
                              key={template.type}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('nodeType', template.type)
                              }}
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                            >
                              <div className="p-1 rounded" style={{ backgroundColor: getNodeColor(template.type) }}>
                                {getNodeIcon(template.type)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {content[language].nodeTypes[template.type as keyof typeof content[typeof language]['nodeTypes']]}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                />
                {!isSaved && <span className="text-sm text-orange-600">•</span>}
              </div>

              <div className="flex items-center space-x-2">
                {/* Tools */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setTool('select')}
                    className={`p-2 ${tool === 'select' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTool('hand')}
                    className={`p-2 ${tool === 'hand' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Hand className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTool('connect')}
                    className={`p-2 ${tool === 'connect' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedNodes.size === 0}
                    className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleTest}
                    disabled={isRunning}
                    className="flex items-center space-x-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>{content[language].actions.test}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>{content[language].actions.save}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const nodeType = e.dataTransfer.getData('nodeType')
                if (nodeType) {
                  handleNodeDrop(e, nodeType)
                }
              }}
            />

            {/* Status overlay */}
            {isRunning && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Running workflow...</span>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{content[language].properties.title}</h3>
          </div>

          <div className="p-4">
            {selectedNodes.size === 1 ? (
              <div className="space-y-4">
                {(() => {
                  const selectedNode = nodes.find(n => selectedNodes.has(n.id))
                  if (!selectedNode) return null

                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {content[language].properties.name}
                        </label>
                        <input
                          type="text"
                          value={selectedNode.name}
                          onChange={(e) => {
                            setNodes(prev => prev.map(node => 
                              node.id === selectedNode.id 
                                ? { ...node, name: e.target.value }
                                : node
                            ))
                            setIsSaved(false)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {content[language].properties.description}
                        </label>
                        <textarea
                          value={selectedNode.description}
                          onChange={(e) => {
                            setNodes(prev => prev.map(node => 
                              node.id === selectedNode.id 
                                ? { ...node, description: e.target.value }
                                : node
                            ))
                            setIsSaved(false)
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {content[language].properties.config}
                        </h4>
                        <div className="text-sm text-gray-500">
                          Node-specific configuration options would appear here
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a node to edit properties
              </div>
            )}
          </div>
        </div>
      </div>
    </OptimizedComponentWrapper>
  )
}