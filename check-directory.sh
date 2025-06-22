#!/bin/bash

# Script to verify you're in the correct Prismy project directory

CORRECT_DIR="/Users/mac/prismy/prismy-production"
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" != "$CORRECT_DIR" ]; then
    echo "❌ ERROR: You are in the wrong directory!"
    echo "📍 Current directory: $CURRENT_DIR"
    echo "✅ Correct directory: $CORRECT_DIR"
    echo ""
    echo "Please run: cd $CORRECT_DIR"
    exit 1
else
    echo "✅ You are in the correct Prismy project directory!"
    echo "📁 $CORRECT_DIR"
    echo ""
    echo "🚀 Ready to work on Prismy!"
fi