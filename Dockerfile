# syntax=docker/dockerfile:1

# Base stage with common dependencies
FROM node:18-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    postgresql-client \
    bash

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy the current directory contents into the container at /app
COPY . .

# Switch to 'node' user for security reasons
USER node

# Inform Docker that the container listens on port 3000 at runtime
EXPOSE 8100

# Command to run the application
CMD ["npm", "run", "dev"]
