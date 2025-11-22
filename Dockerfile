# Simplified Dockerfile for Cloud Run - runs TypeScript directly with tsx
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (production + dev for tsx)
RUN npm ci

# Copy application source code (client excluded by .dockerignore)
COPY server ./server
COPY shared ./shared
COPY generate_and_send_report.cjs ./

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server directly with tsx (no build needed)
CMD ["npx", "tsx", "server/index.ts"]
