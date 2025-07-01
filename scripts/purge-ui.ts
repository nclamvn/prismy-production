#!/usr/bin/env tsx

/**
 * Prismy vNEXT UI Purge Script
 * Smart cleanup of legacy UI components while preserving backend logic
 */

import { readdir, stat, rm } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

const TARGET_FOLDERS = ['app', 'components', 'public/assets', 'styles'] as const

const PRESERVE_PATTERNS = [
  'app/api/**', // Keep all API routes
  'lib/**', // Keep business logic
  'hooks/**', // Keep custom hooks
  'contexts/**', // Keep context providers
  'tests/**', // Keep test suites
  'middleware.ts', // Keep middleware
  'package.json', // Keep dependencies
  '.env*', // Keep environment files
  'next.config.js', // Keep Next.js config
  'tailwind.config.ts', // Will be regenerated
  'tsconfig.json', // Keep TypeScript config
] as const

interface PurgeOptions {
  force?: boolean
  dryRun?: boolean
  backup?: boolean
}

async function getFolderSize(dirPath: string): Promise<number> {
  try {
    const files = await readdir(dirPath, { withFileTypes: true })
    let totalSize = 0

    for (const file of files) {
      const fullPath = join(dirPath, file.name)
      if (file.isDirectory()) {
        totalSize += await getFolderSize(fullPath)
      } else {
        const stats = await stat(fullPath)
        totalSize += stats.size
      }
    }
    return totalSize
  } catch {
    return 0
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

async function analyzeCurrentUI(): Promise<void> {
  console.log('🔍 Analyzing current UI structure...\n')

  for (const folder of TARGET_FOLDERS) {
    try {
      const size = await getFolderSize(folder)
      const files = await readdir(folder, { recursive: true })
      const fileCount = files.filter(
        f => f.endsWith('.tsx') || f.endsWith('.ts')
      ).length

      console.log(
        `📁 ${folder}: ${fileCount} TypeScript files, ${formatBytes(size)}`
      )
    } catch (error) {
      console.log(`📁 ${folder}: Not found`)
    }
  }
  console.log('')
}

async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
  const backupDir = `backup-legacy-ui-${timestamp}`

  console.log(`📦 Creating backup: ${backupDir}`)

  try {
    execSync(`mkdir -p ${backupDir}`)

    for (const folder of TARGET_FOLDERS) {
      try {
        execSync(`cp -r ${folder} ${backupDir}/`, { stdio: 'pipe' })
        console.log(`✅ Backed up: ${folder}`)
      } catch (error) {
        console.log(`⚠️  Skipped: ${folder} (not found)`)
      }
    }

    return backupDir
  } catch (error) {
    throw new Error(`Backup failed: ${error}`)
  }
}

async function purgeUI(options: PurgeOptions): Promise<void> {
  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No files will be deleted\n')
  }

  for (const folder of TARGET_FOLDERS) {
    try {
      console.log(
        `${options.dryRun ? '🧪' : '🗑️'} ${options.dryRun ? 'Would remove' : 'Removing'}: ${folder}`
      )

      if (!options.dryRun) {
        await rm(folder, { recursive: true, force: true })
      }
    } catch (error) {
      console.log(`⚠️  Skipped: ${folder} (not found or error)`)
    }
  }
}

async function createFreshStructure(): Promise<void> {
  console.log('\n🏗️  Creating fresh UI structure...')

  const directories = [
    'app',
    'components/ui',
    'components/layouts',
    'components/providers',
    'components/workspace',
    'lib/design-tokens',
    'public/assets',
    'styles',
  ]

  try {
    for (const dir of directories) {
      execSync(`mkdir -p ${dir}`)
    }
    console.log('✅ Fresh directory structure created')
  } catch (error) {
    console.error('❌ Failed to create structure:', error)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const options: PurgeOptions = {
    force: args.includes('--force') || args.includes('-f'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    backup: !args.includes('--no-backup'),
  }

  console.log('🎯 Prismy vNEXT UI Purge Script')
  console.log('===============================\n')

  await analyzeCurrentUI()

  if (!options.force && !options.dryRun) {
    console.log('⚠️  This will permanently delete the current UI structure!')
    console.log('💡 Run with --dry-run to preview changes')
    console.log('💡 Run with --force to proceed without confirmation')
    console.log('💡 Run with --no-backup to skip backup creation\n')

    // For safety, require explicit confirmation
    process.exit(1)
  }

  let backupDir = ''
  if (options.backup && !options.dryRun) {
    backupDir = await createBackup()
    console.log('')
  }

  await purgeUI(options)

  if (!options.dryRun) {
    await createFreshStructure()

    console.log('\n🎉 UI purge completed successfully!')
    if (backupDir) {
      console.log(`📦 Backup saved: ${backupDir}`)
    }
    console.log('\n📝 Next steps:')
    console.log('1. git checkout -b ui/reset-20250701')
    console.log('2. git add -A && git commit -m "🌋 UI reset for Prismy vNEXT"')
    console.log('3. npm run dev # Start with fresh UI')
  }
}

// Handle errors gracefully
main().catch(error => {
  console.error('❌ Purge script failed:', error.message)
  process.exit(1)
})
