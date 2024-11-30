#!/bin/bash

# Exit on error
set -e

# Function to check if we're running in Docker
is_docker() {
    if [ -f /.dockerenv ]; then
        return 0
    elif [ -f /proc/1/cgroup ] && grep -q docker /proc/1/cgroup; then
        return 0
    else
        return 1
    fi
}

# Function to get database host
get_db_host() {
    if is_docker; then
        echo "db"
    else
        echo "localhost"
    fi
}

# Function to wait for database
wait_for_db() {
    local db_host=$(get_db_host)
    echo "⏳ Waiting for database to be ready..."
    until PGPASSWORD=secretariat psql -h $db_host -U secretariat -d postgres -c '\q'; do
        echo "Postgres is unavailable - sleeping"
        sleep 1
    done
}

# Function to setup databases
setup_databases() {
    local db_host=$(get_db_host)
    echo "🗄️  Setting up databases..."
    PGPASSWORD=secretariat psql -h $db_host -U secretariat -d postgres -c "CREATE DATABASE secretariat;" || true
    PGPASSWORD=secretariat psql -h $db_host -U secretariat -d postgres -c "CREATE DATABASE nextauth;" || true
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    npm run migrate
}

# Function to seed database
seed_database() {
    if [ "$SEED_FAKE_DATA_DATABASE" = "true" ]; then
        echo "🌱 Running database seeds..."
        npm run seed || true
    else
        echo "Skipping database seed (SEED_FAKE_DATA_DATABASE not set to true)"
    fi
}

# Function to import data
import_data() {
    echo "📥 Importing data from www..."
    npm run dev-import-from-www
}

# Function to import real data
import_real_data() {
    echo "📥 Importing real data from beta.gouv.fr..."
    if is_docker; then
        docker compose exec web npm run dev-import-from-www
    else
        npm run dev-import-from-www
    fi
}

# Source initialization scripts
source ./init-dev-env.sh
source ./init-db.sh

# Main setup process
main() {
    # Initialize environment
    if is_docker; then
        setup_docker_env
    else
        setup_local_env
    fi

    # Initialize database
    wait_for_db
    create_databases
    run_migrations
    seed_database
    import_real_data
    
    echo "✅ Setup completed successfully!"
}

# Run main function
main
