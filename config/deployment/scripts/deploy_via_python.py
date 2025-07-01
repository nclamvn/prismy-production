#!/usr/bin/env python3
import subprocess
import os
import sys

def run_command(cmd):
    """Execute a command and return the output"""
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True, cwd='/Users/mac/prismy/prismy-production')
        print(f"✓ {cmd}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {cmd}")
        print(f"Error: {e}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return False

def main():
    print("Starting deployment process...")
    
    # Change to project directory
    os.chdir('/Users/mac/prismy/prismy-production')
    print(f"Working directory: {os.getcwd()}")
    
    # Git status
    print("\n📊 Checking git status...")
    run_command("git status --porcelain")
    
    # Add all changes
    print("\n📁 Adding all changes...")
    if not run_command("git add -A"):
        print("Failed to add files")
        return 1
    
    # Commit with message
    print("\n💾 Creating commit...")
    commit_message = """fix: comprehensive SSR and production deployment fixes

- Fixed next.config.js for production with proper webpack configurations
- Added PDF.js and Tesseract.js stubs for serverless environments
- Fixed all SSR browser API issues by replacing with serverless-compatible implementations
- Configured webpack to handle worker threads and problematic modules
- Added proper fallbacks and externals for Vercel deployment
- Optimized bundle splitting for better performance

These changes ensure stable deployment on Vercel serverless platform.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"""
    
    if not run_command(f'git commit -m "{commit_message}"'):
        print("Failed to commit (possibly no changes)")
        # Check if there are any changes
        run_command("git status")
    
    # Push to GitHub
    print("\n🚀 Pushing to GitHub...")
    if not run_command("git push origin main"):
        print("Failed to push to GitHub")
        return 1
    
    print("\n✅ Deployment completed successfully!")
    print("Vercel will automatically deploy from GitHub.")
    return 0

if __name__ == "__main__":
    sys.exit(main())