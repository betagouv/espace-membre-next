DOCKER-RUN = docker compose run -e TERM --rm --entrypoint=""

.PHONY: build up cucumber

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

# harder than down
die:
	docker compose down --remove-orphans --volumes

sh:
	$(DOCKER-RUN) web /bin/bash

cucumber:
	$(DOCKER-RUN) -e APP_URL=http://web:8100 web npm run e2e:cucumber
