# Multi-stage build for Cloud Run deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code (client excluded by .dockerignore)
COPY . .

# Build backend using esbuild
RUN npm run build:backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built backend from builder
COPY --from=builder /app/dist ./dist

# Copy shared types (needed at runtime)
COPY --from=builder /app/shared ./shared

# Copy critical runtime files
COPY --from=builder /app/generate_and_send_report.cjs ./

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/index.js"]
