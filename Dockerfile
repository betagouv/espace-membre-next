# syntax=docker/dockerfile:1

# Base stage for both development and production
FROM node:20.10.0-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    postgresql-client \
    bash

# Development stage
FROM base AS development

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy package files
COPY --chown=nextjs:nodejs package*.json ./

# Create necessary directories and set permissions
RUN mkdir -p /app/.next /app/node_modules && \
    chown -R nextjs:nodejs /app/.next /app/node_modules && \
    chmod -R 755 /app/.next /app/node_modules

# Switch to non-root user for npm install
USER nextjs

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY --chown=nextjs:nodejs . .

# Make init-db.sh executable
RUN chmod +x init-db.sh

# Keep running as non-root user
USER nextjs

# Expose ports
EXPOSE 8100 9229

# Production stage (for future use)
FROM base AS production
# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy package files
COPY --chown=nextjs:nodejs package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY --chown=nextjs:nodejs . .
RUN chmod +x init-db.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8100

# Start the application
CMD ["npm", "start"]
