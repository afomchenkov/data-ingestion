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

## Check Localstack

```sh
# check for logs
docker logs localstack --tail=50
# you should see "Ready." in the end

# check test bucket (run command inside the container)
docker exec -it localstack awslocal s3 ls

# create another test bucket
docker exec -it localstack awslocal s3 mb s3://another-bucket
docker exec -it localstack awslocal s3 ls
```

## Check Redis

```sh
docker logs redis
# should output: "Ready to accept connections tcp"

docker exec -it redis redis-cli
> PING
# should output: PONG

# check from Redis CLI
redis-cli -h 127.0.0.1 -p 6379 ping
```
