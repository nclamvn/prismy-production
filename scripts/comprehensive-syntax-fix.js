#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Get all TypeScript files that might have been affected
const { execSync } = require('child_process')

function getAllTSFiles() {
  try {
    const output = execSync(
      'find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*"',
      { encoding: 'utf8' }
    )
    return output
      .trim()
      .split('\n')
      .filter(f => f.length > 0)
  } catch (error) {
    console.error('Error finding TypeScript files:', error)
    return []
  }
}

function fixSyntaxErrors(content, filePath) {
  let fixed = content
  let changes = 0

  // Fix missing closing parentheses in return statements
  fixed = fixed.replace(
    /return NextResponse\.json\(\s*([^,]+),\s*\{\s*status:\s*\d+\s*\}\s*$/gm,
    (match, p1) => {
      changes++
      return match + '\n      )'
    }
  )

  // Fix missing closing parentheses on NextResponse.json calls that span multiple lines
  fixed = fixed.replace(
    /NextResponse\.json\(\s*\{[^}]*\},\s*\{\s*status:\s*\d+\s*\}\s*\n\s*\}\s*$/gm,
    match => {
      changes++
      return match.replace(/\}\s*$/, ')\n    }')
    }
  )

  // Fix console.log statements with missing closing parentheses
  fixed = fixed.replace(
    /console\.log\([^)]*$(?:\n[^)]*)*(?=\n\s*[a-zA-Z])/gm,
    match => {
      if (!match.includes(')')) {
        changes++
        return match + ')'
      }
      return match
    }
  )

  // Fix orphaned object properties (lines that start with comma and property)
  fixed = fixed.replace(/^\s*,\s*[a-zA-Z_$][a-zA-Z0-9_$]*:.*$/gm, '')

  // Fix useCallback hooks missing closing parentheses
  fixed = fixed.replace(/\],?\s*\n\s*$/gm, (match, offset, string) => {
    // Check if this is inside a useCallback
    const beforeMatch = string.substring(0, offset)
    const lastUseCallback = beforeMatch.lastIndexOf('useCallback(')
    const lastClosingParen = beforeMatch.lastIndexOf(')')

    if (lastUseCallback > lastClosingParen) {
      changes++
      return match.replace(/\s*$/, '\n  )')
    }
    return match
  })

  // Fix broken object literal syntax
  fixed = fixed.replace(
    /\{\s*\n\s*([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,}]+),?\s*\n\s*if\s*\(/g,
    (match, prop) => {
      changes++
      return `{\n      ${prop}\n    }\n\n    if (`
    }
  )

  // Fix incomplete function calls
  fixed = fixed.replace(
    /(\w+)\(\s*\n\s*([^)]*)\s*\n\s*$/gm,
    (match, funcName, args) => {
      changes++
      return `${funcName}(\n      ${args}\n    )`
    }
  )

  // Fix broken createBrowserClient calls
  if (filePath.includes('supabase.ts')) {
    fixed = fixed.replace(
      /createBrowserClient\(\s*supabaseUrl,\s*supabaseAnonKey,\s*supabaseClientConfig\s*\n\s*\}/,
      'createBrowserClient(\n      supabaseUrl,\n      supabaseAnonKey,\n      supabaseClientConfig\n    )'
    )
  }

  return { content: fixed, changes }
}

function main() {
  console.log('🔧 Comprehensive syntax repair starting...')

  const files = getAllTSFiles()
  let totalFixed = 0
  let totalChanges = 0

  files.forEach(file => {
    if (!fs.existsSync(file)) return

    const content = fs.readFileSync(file, 'utf8')
    const result = fixSyntaxErrors(content, file)

    if (result.changes > 0) {
      fs.writeFileSync(file, result.content)
      console.log(`✅ Fixed ${result.changes} issues in ${file}`)
      totalFixed++
      totalChanges += result.changes
    }
  })

  console.log(
    `\n✨ Repair complete: ${totalChanges} syntax errors fixed in ${totalFixed} files`
  )

  // Run a quick syntax check
  try {
    console.log('\n🔍 Running quick syntax validation...')
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' })
    console.log('✅ Basic TypeScript syntax validation passed')
  } catch (error) {
    console.log(
      '⚠️  Some TypeScript errors remain - manual review may be needed'
    )
  }
}

main()
