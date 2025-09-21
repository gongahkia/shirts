#!/bin/bash

# Development startup script for Shirts Legal Workflow

set -e

echo "🔧 Starting Shirts Legal Workflow in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Running setup first..."
    ./scripts/setup.sh
fi

# Start services
echo "🚀 Starting development servers..."

# Option 1: Use Docker Compose for development
if [ "$1" = "--docker" ]; then
    echo "Starting with Docker Compose..."
    docker-compose -f docker-compose.yml up --build
else
    # Option 2: Use local development servers
    echo "Starting local development servers..."
    npm run dev
fi