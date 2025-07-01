#!/usr/bin/env node

const fs = require('fs')
const { execSync } = require('child_process')

function getAllTSFiles() {
  try {
    const output = execSync('find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*"', { encoding: 'utf8' })
    return output.trim().split('\n').filter(f => f.length > 0)
  } catch (error) {
    return []
  }
}

function fixDoubleParens(content) {
  let fixed = content
  let changes = 0

  // Fix double closing parentheses
  fixed = fixed.replace(/\)\s*\)\s*$/gm, ')')
  if (fixed !== content) changes++

  // Fix missing closing parentheses in console.log
  fixed = fixed.replace(/console\.log\([^)]*$(?=\n\s*\/\/|\n\s*[a-zA-Z]|\n\s*}|\n\s*$)/gm, (match) => {
    changes++
    return match + ')'
  })

  // Fix orphaned closing parentheses on their own lines after statements
  fixed = fixed.replace(/^(\s*)\)\s*$/gm, '')

  // Fix specific broken patterns
  fixed = fixed.replace(/language,\s*\n\s*$(?=\n\s*\/\/|\n\s*const|\n\s*if)/gm, (match) => {
    changes++
    return match.replace(/,\s*\n\s*$/, '\n    })')
  })

  // Fix incomplete object closing after console.log
  fixed = fixed.replace(/language,\s*\n\s*$(?=\n\s*\/\/)/gm, 'language,\n    })')

  return { content: fixed, changes }
}

function main() {
  console.log('🔧 Fixing double parentheses and console.log issues...')
  
  const files = getAllTSFiles()
  let totalFixed = 0

  files.forEach(file => {
    if (!fs.existsSync(file)) return

    const content = fs.readFileSync(file, 'utf8')
    const result = fixDoubleParens(content)
    
    if (result.changes > 0) {
      fs.writeFileSync(file, result.content)
      console.log(`✅ Fixed ${result.changes} issues in ${file}`)
      totalFixed++
    }
  })

  console.log(`\n✨ Fixed double parentheses in ${totalFixed} files`)
}

main()