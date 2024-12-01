.PHONY: dev setup clean rebuild logs pull-data init-env db-reset check-env shell

# Development
dev:
	docker compose up

# Check required environment variables
check-env:
	@echo "Checking required environment variables..."
	@test -f .env || (echo "❌ .env file not found" && exit 1)
	@echo "✅ Environment check passed"

# First time setup with data
setup: init-env check-env
	@echo "🚀 Starting setup process..."
	docker compose build --no-cache
	docker compose up -d
	@echo "⏳ Waiting for database to be ready..."
	@until docker compose exec -T db pg_isready -U secretariat; do \
		echo "Database is unavailable - sleeping"; \
		sleep 2; \
	done
	@echo "✅ Database is ready!"
	@echo "🔄 Running database migrations..."
	@docker compose exec -T web npm run migrate || (echo "❌ Migration failed" && exit 1)
	@echo "🌱 Seeding initial users..."
	@docker compose exec -T web npm run seed || (echo "❌ Seeding failed" && exit 1)
	@echo "📥 Pulling data from beta.gouv.fr..."
	@docker compose exec -T web npm run dev-import-from-www || (echo "❌ Data import failed" && exit 1)
	@echo "🎉 Setup completed successfully!"
	@echo "💡 You can now access:"
	@echo "   - Application: http://localhost:8100"
	@echo "   - MailDev: http://localhost:1080"

# Pull data from beta.gouv.fr
pull-data:
	@echo "📥 Importing data from beta.gouv.fr..."
	docker compose exec -T web npm run dev-import-from-www
	@echo "✅ Data import completed!"

# Initialize development environment
init-env:
	@echo "Configuring development environment..."
	@cp .env.example .env
	@echo "Development environment configured with example values"

# Clean everything
clean:
	docker compose down --volumes --remove-orphans
	docker system prune -f

# Rebuild and restart
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up

# View logs
logs:
	docker compose logs -f

# Reset database with user seeds
db-reset:
	@echo "Resetting database with user seeds..."
	docker compose exec -T web npm run migrate || (echo "❌ Migration failed" && exit 1)
	docker compose exec -T web npm run seed || (echo "❌ Seeding failed" && exit 1)
	@echo "✅ Database reset completed!"

# Access shell
shell:
	docker compose exec web /bin/bash
