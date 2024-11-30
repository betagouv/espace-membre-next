#!/bin/bash

# Exit on error
set -e

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    for i in {1..30}; do
        if PGPASSWORD=secretariat psql -h db -U secretariat -d postgres -c '\q' >/dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        echo "Postgres is unavailable - attempt $i/30"
        sleep 2
    done
    echo "❌ Failed to connect to database after 30 attempts"
    return 1
}

# Function to create databases
create_databases() {
    echo "🗄️  Setting up databases..."
    if ! PGPASSWORD=secretariat psql -h db -U secretariat -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'secretariat'" | grep -q 1; then
        PGPASSWORD=secretariat psql -h db -U secretariat -d postgres -c "CREATE DATABASE secretariat;"
    fi
    
    if ! PGPASSWORD=secretariat psql -h db -U secretariat -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'nextauth'" | grep -q 1; then
        PGPASSWORD=secretariat psql -h db -U secretariat -d postgres -c "CREATE DATABASE nextauth;"
    fi
    
    echo "✅ Databases created successfully!"
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    npm run migrate
    echo "✅ Migrations completed!"
}

# Function to seed database with user data
seed_database() {
    if [ "$SEED_FAKE_DATA_DATABASE" = "true" ]; then
        echo "🌱 Running database seeds..."
        # Try to run seeds, but don't fail if there are duplicate entries
        npm run seed || true
        echo "✅ Database initialization completed!"
    else
        echo "ℹ️  Skipping database seed (SEED_FAKE_DATA_DATABASE not set to true)"
    fi
}

# Main execution
echo "🚀 Starting database initialization..."

wait_for_db
create_databases
run_migrations
seed_database

echo "✅ Database initialization completed!"

# Start the application
if [ "$1" = "start" ]; then
    echo "🚀 Starting Next.js development server..."
    exec npm run dev
fi
