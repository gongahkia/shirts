#!/bin/bash

# Production deployment script for Shirts Legal Workflow

set -e

echo "🚀 Deploying Shirts Legal Workflow to production..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with production values."
    exit 1
fi

# Validate required environment variables
source .env

if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "❌ GEMINI_API_KEY is not set in .env file"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_super_secure_jwt_secret_here" ]; then
    echo "❌ JWT_SECRET is not set in .env file"
    exit 1
fi

echo "✅ Environment validation passed"

# Pull latest images and build
echo "📦 Building production images..."
docker-compose build --no-cache

# Run tests
echo "🧪 Running tests..."
cd backend && npm test && cd ..
cd frontend && npm test && cd ..

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start production services
echo "🚀 Starting production services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

echo "🎉 Deployment successful!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Health Check: http://localhost:3001/health"
echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "📝 To stop services: docker-compose down"