#!/bin/bash

# Build script for Calendar QA application
# Usage: ./build.sh [API_URL]
# Example: ./build.sh https://your-domain.com

set -e

API_URL=${1:-"http://localhost:3000"}

echo "Building Calendar QA with API URL: $API_URL"

# Set environment variable
export VITE_API_BASE_URL=$API_URL

# Create .env file for frontend
echo "VITE_API_BASE_URL=$API_URL" > frontend/.env

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Build Docker containers
echo "Building Docker containers..."
docker-compose build --no-cache

echo "Build completed successfully!"
echo "You can now run: docker-compose up -d"
echo "Frontend will be available at: http://localhost:80"
echo "Backend API will be available at: http://localhost:3000"