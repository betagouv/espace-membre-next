.PHONY: dev setup clean rebuild logs pull-data init-env db-reset

# Development
dev:
	docker compose up

# First time setup with data
setup: init-env
	docker compose build --no-cache
	docker compose up -d
	@echo "Waiting for services to start..."
	@sleep 10
	@make db-reset
	@make pull-data

# Pull data from beta.gouv.fr
pull-data:
	@echo "📥 Importing data from beta.gouv.fr..."
	docker compose exec web npm run dev-import-from-www
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
	docker compose exec web npm run migrate
	docker compose exec web npm run seed
	@echo "✅ Database reset completed!"

# Access shell
shell:
	docker compose exec web /bin/bash
