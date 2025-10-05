COMPOSE_FILES = \
  -f docker/compose.yml \
  -f docker/compose.db.yml \
  -f docker/compose.cache.yml \
  -f docker/compose.kafka.yml \
  -f docker/compose.monitoring.yml

up:
	docker compose $(COMPOSE_FILES) up -d

down:
	docker compose $(COMPOSE_FILES) down

logs:
	docker compose $(COMPOSE_FILES) logs -f
