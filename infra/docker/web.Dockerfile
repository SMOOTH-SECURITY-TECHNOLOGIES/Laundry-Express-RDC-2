FROM node:22-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy dependency manifests first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
# In dev, this mainly serves as a fallback because docker-compose mounts the repo into /app
COPY . .

# Create non-root user (kept for future hardening, but not used as runtime user in this dev image)
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

# Expose Vite dev server port
EXPOSE 3003

# Health check for Vite dev server
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:3003/ || exit 1

# Start dev server
# Run as root in dev so Vite can create /app/node_modules/.vite when volumes are mounted
CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0 --port 3003"]