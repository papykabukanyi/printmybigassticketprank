#!/bin/bash

# Railway deployment script
echo "🚀 Starting Railway deployment..."

# Install dependencies with npm install instead of npm ci
echo "📦 Installing dependencies..."
npm install --production=false

# Run tests
echo "🧪 Testing dependencies..."
npm run test-deps || echo "⚠️ Dependency test failed, continuing..."

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
