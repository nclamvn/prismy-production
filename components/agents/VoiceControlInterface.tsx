'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Zap, Brain, FileText, Users, Settings, AlertCircle, CheckCircle } from 'lucide-react'
import { motionSafe, slideUp, fadeIn, scaleIn } from '@/lib/motion'

interface VoiceCommand {
  id: string
  transcript: string
  intent: string
  confidence: number
  timestamp: Date
  status: 'processing' | 'completed' | 'failed'
  result?: string
}

interface VoiceControlInterfaceProps {
  language?: 'vi' | 'en'
  onCommand?: (command: VoiceCommand) => void
}

export default function VoiceControlInterface({ language = 'en', onCommand }: VoiceControlInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const content = {
    vi: {
      title: 'Điều Khiển Bằng Giọng Nói',
      subtitle: 'Ra lệnh cho AI bằng giọng nói tự nhiên',
      startListening: 'Bắt đầu nghe',
      stopListening: 'Dừng nghe',
      listening: 'Đang nghe...',
      speak: 'Nói lệnh của bạn',
      processing: 'Đang xử lý...',
      commandHistory: 'Lịch sử lệnh',
      noCommands: 'Chưa có lệnh nào',
      notSupported: 'Trình duyệt không hỗ trợ nhận dạng giọng nói',
      examples: {
        title: 'Ví dụ lệnh',
        commands: [
          'Tạo agent phân tích tài chính',
          'Phân tích tài liệu contract.pdf',
          'Tìm tất cả insights về revenue',
          'Bắt đầu cộng tác giữa các agents',
          'Hiển thị báo cáo tổng hợp'
        ]
      },
      intents: {
        createAgent: 'Tạo agent',
        analyze: 'Phân tích',
        search: 'Tìm kiếm',
        collaborate: 'Cộng tác',
        report: 'Báo cáo'
      }
    },
    en: {
      title: 'Voice Control',
      subtitle: 'Command AI with natural voice',
      startListening: 'Start Listening',
      stopListening: 'Stop Listening',
      listening: 'Listening...',
      speak: 'Speak your command',
      processing: 'Processing...',
      commandHistory: 'Command History',
      noCommands: 'No commands yet',
      notSupported: 'Speech recognition not supported in this browser',
      examples: {
        title: 'Example Commands',
        commands: [
          'Create a financial analysis agent',
          'Analyze document contract.pdf',
          'Find all insights about revenue',
          'Start collaboration between agents',
          'Show summary report'
        ]
      },
      intents: {
        createAgent: 'Create agent',
        analyze: 'Analyze',
        search: 'Search',
        collaborate: 'Collaborate',
        report: 'Report'
      }
    }
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        setIsSupported(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US'

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          processCommand(finalTranscript.trim())
        }
        
        setInterimTranscript(interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        if (isListening) {
          recognition.start()
        }
      }

      recognitionRef.current = recognition
    }
  }, [language, isListening])

  // Initialize audio visualization
  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
          
          analyserRef.current.fftSize = 256
          microphoneRef.current.connect(analyserRef.current)

          const updateAudioLevel = () => {
            if (!analyserRef.current || !isListening) return

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(dataArray)
            
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average / 128) // Normalize to 0-1
            
            requestAnimationFrame(updateAudioLevel)
          }

          updateAudioLevel()
        })
        .catch(err => {
          console.error('Microphone access denied:', err)
          setIsListening(false)
        })
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [isListening])

  const processCommand = (text: string) => {
    const command: VoiceCommand = {
      id: `cmd-${Date.now()}`,
      transcript: text,
      intent: detectIntent(text),
      confidence: 0.85 + Math.random() * 0.15,
      timestamp: new Date(),
      status: 'processing'
    }

    setCommands(prev => [command, ...prev].slice(0, 10))
    onCommand?.(command)

    // Simulate processing
    setTimeout(() => {
      setCommands(prev => 
        prev.map(cmd => 
          cmd.id === command.id 
            ? { 
                ...cmd, 
                status: 'completed',
                result: `Executed: ${cmd.intent} - "${cmd.transcript}"`
              }
            : cmd
        )
      )
    }, 1500)
  }

  const detectIntent = (text: string): string => {
    const lowerText = text.toLowerCase()
    const intents = content[language].intents

    if (lowerText.includes('create') || lowerText.includes('tạo')) {
      return intents.createAgent
    } else if (lowerText.includes('analyze') || lowerText.includes('phân tích')) {
      return intents.analyze
    } else if (lowerText.includes('find') || lowerText.includes('search') || lowerText.includes('tìm')) {
      return intents.search
    } else if (lowerText.includes('collaborat') || lowerText.includes('cộng tác')) {
      return intents.collaborate
    } else if (lowerText.includes('report') || lowerText.includes('báo cáo')) {
      return intents.report
    }
    
    return 'General'
  }

  const toggleListening = () => {
    if (!isSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setTranscript('')
      setInterimTranscript('')
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case content[language].intents.createAgent:
        return <Brain className="w-4 h-4" />
      case content[language].intents.analyze:
        return <FileText className="w-4 h-4" />
      case content[language].intents.search:
        return <Zap className="w-4 h-4" />
      case content[language].intents.collaborate:
        return <Users className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {content[language].title}
          </h3>
          <p className="text-gray-600">
            {content[language].notSupported}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content[language].title}
        </h2>
        <p className="text-gray-600">{content[language].subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Control Panel */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          {/* Microphone Button */}
          <div className="flex flex-col items-center">
            <motion.button
              onClick={toggleListening}
              className={`relative w-32 h-32 rounded-full transition-all ${
                isListening 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Audio Level Visualization */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ 
                      scale: 1 + audioLevel * 0.5,
                      opacity: 0.3 + audioLevel * 0.2
                    }}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                )}
              </AnimatePresence>
              
              {isListening ? (
                <MicOff className="w-12 h-12 text-white relative z-10" />
              ) : (
                <Mic className="w-12 h-12 text-white relative z-10" />
              )}

              {/* Listening Animation */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
            
            <p className="mt-4 text-lg font-medium text-gray-900">
              {isListening ? content[language].listening : content[language].startListening}
            </p>
            
            {isListening && (
              <p className="text-sm text-gray-600 mt-2">
                {content[language].speak}
              </p>
            )}
          </div>

          {/* Live Transcript */}
          {(transcript || interimTranscript) && (
            <motion.div
              variants={motionSafe(fadeIn)}
              className="mt-6 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start space-x-2">
                <Volume2 className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-900">{transcript}</p>
                  {interimTranscript && (
                    <p className="text-gray-500 italic">{interimTranscript}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Example Commands */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              {content[language].examples.title}
            </h3>
            <div className="space-y-2">
              {content[language].examples.commands.map((example, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => processCommand(example)}
                >
                  "{example}"
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Command History */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">
            {content[language].commandHistory}
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commands.length > 0 ? (
              commands.map((command) => (
                <motion.div
                  key={command.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        command.status === 'completed' 
                          ? 'bg-green-100 text-green-600'
                          : command.status === 'failed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getIntentIcon(command.intent)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {command.transcript}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {command.intent}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {Math.round(command.confidence * 100)}% confidence
                          </span>
                        </div>
                        {command.result && (
                          <p className="text-sm text-green-600 mt-2">
                            {command.result}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {command.status === 'processing' ? (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      ) : command.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {content[language].noCommands}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}