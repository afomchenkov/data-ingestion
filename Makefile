COMPOSE_FILES = \
  -f docker/compose.yml \
  -f docker/compose.db.yml \
	-f docker/compose.kafka.yml \
  -f docker/compose.localstack.yml

up:
	docker compose $(COMPOSE_FILES) up -d

down:
	docker compose $(COMPOSE_FILES) down

build:
	docker compose $(COMPOSE_FILES) build --no-cache

logs:
	docker compose $(COMPOSE_FILES) logs -f

clean:
	docker compose $(COMPOSE_FILES) down -v --rmi all

clean_volumes:
	docker volume rm $(docker volume ls -q)

rebuild:
	docker compose $(COMPOSE_FILES) up -d --build

shell:
	docker compose $(COMPOSE_FILES) exec app /bin/bash
