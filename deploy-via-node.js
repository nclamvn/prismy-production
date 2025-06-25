const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Change to project directory
process.chdir('/Users/mac/prismy/prismy-production');
console.log('Working directory:', process.cwd());

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent) {
      console.log(`✓ ${command}`);
      if (output) console.log(output);
    }
    return { success: true, output };
  } catch (error) {
    console.error(`✗ ${command}`);
    console.error('Error:', error.message);
    return { success: false, error };
  }
}

async function deploy() {
  console.log('🚀 Starting deployment process...\n');

  // Check git status
  console.log('📊 Checking git status...');
  const status = runCommand('git status --porcelain');
  
  if (!status.output || status.output.trim() === '') {
    console.log('No changes to commit.');
    return;
  }

  // Add all changes
  console.log('\n📁 Adding all changes...');
  const addResult = runCommand('git add -A');
  if (!addResult.success) {
    console.error('Failed to add files');
    process.exit(1);
  }

  // Create commit
  console.log('\n💾 Creating commit...');
  const commitMessage = `fix: comprehensive SSR and production deployment fixes

- Fixed next.config.js for production with proper webpack configurations
- Added PDF.js and Tesseract.js stubs for serverless environments
- Fixed all SSR browser API issues by replacing with serverless-compatible implementations
- Configured webpack to handle worker threads and problematic modules
- Added proper fallbacks and externals for Vercel deployment
- Optimized bundle splitting for better performance

These changes ensure stable deployment on Vercel serverless platform.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  // Write commit message to temporary file to avoid escaping issues
  const tempFile = path.join(process.cwd(), '.commit-msg-temp');
  fs.writeFileSync(tempFile, commitMessage);
  
  const commitResult = runCommand(`git commit -F "${tempFile}"`);
  
  // Clean up temp file
  try {
    fs.unlinkSync(tempFile);
  } catch (e) {
    // Ignore cleanup errors
  }

  if (!commitResult.success) {
    console.error('Failed to commit changes');
    process.exit(1);
  }

  // Push to GitHub
  console.log('\n🚀 Pushing to GitHub...');
  const pushResult = runCommand('git push origin main');
  if (!pushResult.success) {
    console.error('Failed to push to GitHub');
    process.exit(1);
  }

  console.log('\n✅ Deployment completed successfully!');
  console.log('🌐 Vercel will automatically deploy from GitHub.');
  console.log('🔗 Check deployment status at: https://vercel.com/dashboard');
}

// Run deployment
deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});