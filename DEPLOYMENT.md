# Deployment Guide

This guide explains how to deploy the Calendar QA application in different environments.

## ✅ Docker Compose Status: WORKING

The Docker Compose setup is confirmed working! Both frontend and backend containers start successfully and communicate properly.

## Quick Start

### Default Deployment (Localhost)
```bash
# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/swagger
```

### Custom API URL Deployment
```bash
# 1. Set your API URL in frontend/.env
echo "VITE_API_BASE_URL=https://your-domain.com" > frontend/.env

# 2. Rebuild frontend with new API URL
cd frontend && npm run build && cd ..

# 3. Start containers
docker-compose up -d
```

## Environment Configuration

### For Different Deployment Scenarios:

#### Production with Domain
```bash
# Set API URL and rebuild
echo "VITE_API_BASE_URL=https://api.your-domain.com" > frontend/.env
cd frontend && npm run build && cd ..
docker-compose build frontend
docker-compose up -d
```

#### Production with IP Address
```bash
# Set API URL and rebuild
echo "VITE_API_BASE_URL=http://192.168.1.100:3000" > frontend/.env
cd frontend && npm run build && cd ..
docker-compose build frontend
docker-compose up -d
```

#### Development with External API
```bash
# Set API URL and rebuild
echo "VITE_API_BASE_URL=https://dev-api.example.com" > frontend/.env
cd frontend && npm run build && cd ..
docker-compose build frontend
docker-compose up -d
```

## Build Script (Automated)

Use the provided build script for easy deployment:

```bash
# Default (localhost:3000)
./build.sh

# Custom API URL
./build.sh https://your-domain.com
./build.sh http://192.168.1.100:3000
./build.sh https://api.your-domain.com
```

## Verification Commands

```bash
# Check containers are running
docker ps

# Test backend API
curl http://localhost:3000/employees

# Test frontend
curl http://localhost:80

# Check logs
docker-compose logs -f
```

## File Structure for Environment Management

```
calendar-qa/
├── .env.example                 # Environment template
├── frontend/
│   ├── .env                     # Frontend environment variables
│   ├── .env.example            # Frontend environment template
│   └── src/services/api.ts     # API configuration (uses VITE_API_BASE_URL)
├── docker-compose.yml          # Container orchestration
├── build.sh                    # Automated build script
└── DEPLOYMENT.md               # This file
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Ensure `frontend/.env` has correct `VITE_API_BASE_URL`
   - Rebuild frontend: `cd frontend && npm run build && cd ..`
   - Restart containers: `docker-compose restart`

2. **Environment changes not taking effect**
   - Environment variables are build-time, not runtime
   - Always rebuild after changing `VITE_API_BASE_URL`
   - Use the build script for convenience

3. **Containers not starting**
   - Check Docker daemon is running
   - Verify ports 80 and 3000 are available
   - Check logs: `docker-compose logs`

### Port Information
- **Frontend**: Port 80 (nginx)
- **Backend**: Port 3000 (mapped from internal 3001)
- **Database**: SQLite file in backend container

## Production Notes
- The setup uses SQLite for simplicity
- Database persists in Docker volume `calendar-data`
- Logs persist in Docker volume `calendar-logs`
- For production, consider using external database
- Update CORS settings in backend for production domains