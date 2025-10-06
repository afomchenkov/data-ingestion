COMPOSE_FILES = \
  -f docker/compose.yml \
  -f docker/compose.db.yml \
  -f docker/compose.cache.yml \
  -f docker/compose.kafka.yml \
  -f docker/compose.localstack.yml \
  -f docker/compose.monitoring.yml

up:
	docker compose $(COMPOSE_FILES) up -d

down:
	docker compose $(COMPOSE_FILES) down

build:
	docker compose $(COMPOSE_FILES) build

logs:
	docker compose $(COMPOSE_FILES) logs -f

clean:
	docker compose $(COMPOSE_FILES) down -v --rmi all

rebuild:
	docker compose $(COMPOSE_FILES) up -d --build

shell:
	docker compose $(COMPOSE_FILES) exec app /bin/bash
