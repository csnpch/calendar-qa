# Backend Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package*.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM base AS build
RUN apk add --no-cache python3 make g++
COPY package*.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build index.ts --outdir ./dist --target=bun

# Production image
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/package*.json ./
COPY --from=build /app/index.ts ./

# Create logs and data directories with proper permissions
RUN mkdir -p logs data && chmod 755 logs data

# Expose port
EXPOSE 3001

# Run the application
CMD ["bun", "index.ts"]