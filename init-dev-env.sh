#!/bin/bash

# Exit on error
set -e

# Function to check if we're running in Docker
is_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup local environment
setup_local_env() {
    echo "🔧 Setting up local development environment..."

    # Check prerequisites
    if ! command_exists node; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi

    if ! command_exists psql; then
        echo "❌ PostgreSQL is required but not installed"
        exit 1
    fi

    if ! command_exists redis-cli; then
        echo "❌ Redis is required but not installed"
        exit 1
    fi

    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from example..."
        cp .env.example .env
        echo "⚠️  Please edit .env file with your local settings"
    fi

    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
}

# Function to setup Docker environment
setup_docker_env() {
    echo "🐳 Setting up Docker development environment..."

    # Check prerequisites
    if ! command_exists docker; then
        echo "❌ Docker is required but not installed"
        exit 1
    fi

    if ! command_exists docker-compose; then
        echo "❌ Docker Compose is required but not installed"
        exit 1
    fi

    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from example..."
        cp .env.example .env
        echo "⚠️  Please edit .env file with your settings if needed"
    fi

    # Start Docker services
    echo "🚀 Starting Docker services..."
    docker-compose up -d

    # Fix permissions for the entire app directory
    echo "🔒 Setting up permissions..."
    docker-compose exec -T web chown -R node:node /app
    docker-compose exec -T web chmod -R 755 /app

    # Wait for services to be healthy
    echo "⏳ Waiting for services to be ready..."
    sleep 10

    # Initialize database
    echo "🗄️ Setting up database..."
    ./init-db.sh

    # Follow logs if requested
    if [ "$FOLLOW" = true ]; then
        echo "📋 Following web service logs..."
        docker-compose logs -f web
    else
        echo "✅ Services started! You can access:"
        echo "  • Web app: http://localhost:8100"
        echo "  • Mail catcher: http://localhost:1080"
        echo "  • Database: localhost:5432"
        echo "  • Redis: localhost:6379"
        echo ""
        echo "To view logs, run: docker-compose logs -f web"
    fi
}

# Main function
main() {
    echo "🚀 Initializing development environment..."

    if is_docker; then
        setup_docker_env
    else
        # If Docker is available, ask user for preference
        if command_exists docker && command_exists docker-compose; then
            read -p "Would you like to use Docker for development? (y/n) " use_docker
            if [[ $use_docker =~ ^[Yy]$ ]]; then
                setup_docker_env
            else
                setup_local_env
            fi
        else
            setup_local_env
        fi
    fi

    echo "✅ Development environment setup completed!"
    echo "📚 Check the README.md for next steps and available commands"
}

# Run main function
main
