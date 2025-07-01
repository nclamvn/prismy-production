'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SimpleWorkspace() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Read file content for text files
      if (selectedFile.type === 'text/plain') {
        const reader = new FileReader()
        reader.onload = (e) => {
          setText(e.target?.result as string)
        }
        reader.readAsText(selectedFile)
      }
    }
  }

  const handleTranslate = async () => {
    if (!text.trim()) return
    
    setIsTranslating(true)
    try {
      // Simulate translation API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTranslatedText(`[Translated] ${text}`)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access workspace</h1>
          <a href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Prismy Workspace</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.email}</span>
            <button className="text-red-600 hover:text-red-700">Sign Out</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Input</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Translate
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to translate..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={!text.trim() || isTranslating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Translation Output</h2>
            
            {translatedText ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Translated Text</h3>
                  <p className="text-green-700">{translatedText}</p>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Copy
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Translation will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}