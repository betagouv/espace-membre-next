# syntax=docker/dockerfile:1

# Base stage for shared configuration
FROM node:18 AS base
WORKDIR /app

# Development stage
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 8100 9229
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install all dependencies (we need devDependencies for migrations)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

EXPOSE 8100
CMD ["npm", "run", "start"]
