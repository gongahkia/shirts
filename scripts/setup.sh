#!/bin/bash

# Shirts Legal Workflow Setup Script
# This script sets up the development environment for the Shirts Legal Workflow application

set -e

echo "🚀 Setting up Shirts Legal Workflow..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed (for development)
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. This is required for local development."
    echo "   You can still run the application with Docker."
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys before running the application."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/data/vector_db
mkdir -p backend/data/legal_docs
mkdir -p backend/data/case_law

# Set permissions
chmod 755 backend/logs
chmod 755 backend/uploads
chmod 755 backend/data

echo "📦 Installing dependencies..."

# Install backend dependencies
if [ -f "backend/package.json" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies
if [ -f "frontend/package.json" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Install root dependencies
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    npm install
fi

echo "🔧 Setting up development tools..."

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit the .env file and add your API keys:"
echo "   - GEMINI_API_KEY: Get from Google AI Studio"
echo "   - OPENAI_API_KEY: Get from OpenAI Dashboard (optional, for embeddings)"
echo ""
echo "2. Start the application:"
echo "   For development: npm run dev"
echo "   For production: docker-compose up"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Health: http://localhost:3001/health"
echo ""
echo "📚 For more information, see README2.md"