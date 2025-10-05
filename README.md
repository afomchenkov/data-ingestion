# Data Ingestion

## Run compose files

```sh
docker compose \
  -f docker/compose.yml \
  -f docker/compose.db.yml \
  -f docker/compose.cache.yml \
  -f docker/compose.kafka.yml \
  -f docker/compose.localstack.yml \
  -f docker/compose.monitoring.yml
  up -d

# OR

make up
```

## To stop running images

```sh
make down
```

This should start all necessary services and dependencies.

## Log in to PgAdmin on local start

```txt
email: pgadmin4@pgadmin.org
password: postgres
```

## Check Kafka status

```sh
docker logs kafka
# check running images
docker ps
```

## Check Grafana logs

```sh
docker logs grafana --tail=50
```

To see the dashboard, open: http://localhost:3000
Healthcheck: http://localhost:3000/api/health

```txt
username: admin
password: admin
```
