#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const filesToFix = [
  'hooks/useSmartNavigation.ts',
  'lib/supabase.ts',
  'app/api/documents/analyze/route.ts',
  'app/api/documents/chat/route.ts',
  'app/api/documents/process-chunked/route.ts'
]

const patterns = [
  // Pattern for broken console.log calls - fix with complete statements
  {
    regex: /^\s*['"`][^'"`]*['"`]\s*\)\s*$/gm,
    fix: (match, fullText, lineIndex) => {
      // Check if the previous line contains an incomplete console.log
      const lines = fullText.split('\n')
      const currentLine = lines[lineIndex]
      
      // If this looks like an orphaned string with closing paren, remove it
      if (currentLine.trim().match(/^['"`][^'"`]*['"`]\s*\)\s*$/)) {
        return ''
      }
      return match
    }
  },
  // Pattern for incomplete object properties after console.log
  {
    regex: /,\s*([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,}]+),?\s*$/gm,
    fix: (match, fullText, lineIndex) => {
      const lines = fullText.split('\n')
      const currentLine = lines[lineIndex]
      
      // Check if this is a dangling property from a removed console.log
      if (currentLine.trim().startsWith(',') && currentLine.includes(':')) {
        return ''
      }
      return match
    }
  }
]

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`)
    return false
  }
  
  let content = fs.readFileSync(fullPath, 'utf8')
  const originalContent = content
  let fixes = 0
  
  // Manual fixes for specific patterns
  
  // Fix useSmartNavigation.ts
  if (filePath.includes('useSmartNavigation.ts')) {
    content = content.replace(
      /\s*'🌐 SmartNavigation: Window location available, current:',\s*window\.location\.href\s*\)/g,
      ''
    )
    
    // Check for other broken patterns
    content = content.replace(
      /^\s*['"`][^'"`]*['"`]\s*\)\s*$/gm,
      ''
    )
  }
  
  // Fix supabase.ts
  if (filePath.includes('supabase.ts')) {
    content = content.replace(
      /\s*'💣 \[NUCLEAR SUPABASE\] Creating ABSOLUTE SINGLETON - only time this will happen'\s*\)/g,
      ''
    )
  }
  
  // Fix analyze/route.ts
  if (filePath.includes('analyze/route.ts')) {
    content = content.replace(
      /,\s*insightsGenerated: insights\.length,\s*types: insights\.map\(i => i\.type\),\s*\}\)/g,
      ''
    )
  }
  
  // Fix chat/route.ts  
  if (filePath.includes('chat/route.ts')) {
    content = content.replace(
      /,\s*questionType,\s*responseLength: response\.length,\s*confidence,\s*sourcesFound: sources\.length,\s*suggestionsProvided: suggestions\.length,/g,
      ''
    )
  }
  
  // Fix process-chunked/route.ts
  if (filePath.includes('process-chunked/route.ts')) {
    content = content.replace(
      /\s*`🔄 Processing chunk \$\{chunkMetadata\.chunkIndex \+ 1\}\/\$\{chunkMetadata\.totalChunks\} for \$\{chunkMetadata\.fileName\}`\s*\)/g,
      ''
    )
  }
  
  // General cleanup of orphaned lines
  content = content.replace(/^\s*,\s*[a-zA-Z_$][a-zA-Z0-9_$]*:.*$/gm, '')
  content = content.replace(/^\s*\}\)\s*$/gm, '')
  content = content.replace(/^\s*\)\s*$/gm, '')
  content = content.replace(/^\s*['"`][^'"`]*['"`]\s*$/gm, '')
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content)
    console.log(`✅ Fixed syntax errors in ${filePath}`)
    return true
  } else {
    console.log(`ℹ️  No fixes needed for ${filePath}`)
    return false
  }
}

console.log('🔧 Fixing console.log syntax errors...')

let totalFixed = 0
filesToFix.forEach(file => {
  if (fixFile(file)) {
    totalFixed++
  }
})

console.log(`\n✨ Fixed ${totalFixed} files`)