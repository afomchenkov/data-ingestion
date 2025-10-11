# Data Ingestion

## Prerequisiztes

Make sure you have installed:
- `18.0.0 <= Node < 21.0.0`
- `Python > 3.11`
- Docker (docker compose)
- Make tool to [build the project](https://formulae.brew.sh/formula/make)
- Yarn [package manager](https://formulae.brew.sh/formula/yarn)

## To run the project and check uploads

From the root folder:

```sh
# install all dependencies
yarn install
# build shared lib
yarn bootstrap
# start all necessary services via Docker and check that
# all containers started: DB, Localstack, Kafka
make up
# create necessary .env files and start the services
# go to /packages/uploader and copy .env.example into created .env file
cp .env.example .env
# go to /packages/parser and copy .env.example into created .env file
cp .env.example .env

# start service `uploader` from root
yarn run start:uploader
# or from ~/packages/uploader
yarn run start:dev
# this should start the service at port 8181
# to check the Swagger doc go to: http://localhost:8181/api/v1/docs


# start service `parser` from root
yarn run start:parser
# or from ~/packages/parser
yarn run start:dev
# this should start the service at port 8282
# to check the Swagger doc go to: http://localhost:8282/api/v1/docs
```

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
url: http://localhost:5050
email: pgadmin4@pgadmin.org
password: postgres
```

## DB Credentials

```txt
host: data-ingestion-db
db_name: data-ingestion
user: postgres
password: secret
```

## Check DB

```sh
# check logs
docker logs data-ingestion-db
docker logs --tail 100 -f data-ingestion-db

# remove all volumes
docker volume rm $(docker volume ls -q)
```

## Check Kafka status

```sh
docker logs kafka
# check running images
docker ps

# login into Kafka bash
docker exec -it kafka bash

# verify topics
kafka-topics --list --bootstrap-server localhost:9092

# list consumer groups
kafka-consumer-groups --bootstrap-server localhost:9092 --list

# list topics
kafka-topics --bootstrap-server localhost:9092 --list

# describe data_ingestion topic
kafka-topics --bootstrap-server localhost:9092 \
  --describe --topic data_ingestion

# check ingest messages
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic data_ingestion \
  --from-beginning

# check last 10 messages
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic data_ingestion --from-beginning --max-messages 10

# publish test message
kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic data_ingestion

# reset consumer group
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group data-ingestion-consumer-group --reset-offsets \
  --to-earliest --all-topics --execute

# created consumer groups
# data-ingestion-producer-group-client
# data-ingestion-consumer-group-server
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
# check for S3 logs
docker logs localstack --tail=50
# you should see "Ready." in the end

# check test bucket (run command inside the container)
docker exec -it localstack awslocal s3 ls

# create another test bucket
docker exec -it localstack awslocal s3 mb s3://another-bucket
docker exec -it localstack awslocal s3 ls

# check SQS
docker exec -it localstack awslocal sqs list-queues

# it should output
# {
#     "QueueUrls": [
#         "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/raw-data-ingestion-queue"
#     ]
# }

# check bucket config
docker exec -it localstack awslocal s3api get-bucket-notification-configuration --bucket raw-data-ingestion-bucket
docker exec -it localstack awslocal s3api get-bucket-versioning --bucket raw-data-ingestion-bucket
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

## Check loader service

```sh
curl localhost:8181/api/v1/health/liveness

# should output ok all systems 'up'
```

## Submit test CSV/JSON file

```sh
# 1. go to folder ./scripts/file_generator
# 2. run necessary file generator
# 3. adjust the file name
# 4. choose any tenant by running the URL (GET): http://localhost:8181/api/v1/files/tenants
# 5. run the following URL to get signed URL (POST): http://localhost:8181/api/v1/files/uploads/init
# 6. upload to S3 via signed URL with the request below

# supported types:
#   'text/csv'
#   'application/json'
#   'application/x-ndjson'

# NDJSON request for upload
curl -X PUT \
  -T ./random_data.ndjson \
  -H "Content-Type: application/x-ndjson" \
  "signed_url"

# CSV request for upload
curl -X PUT \
  -T ./random_data.csv \
  -H "Content-Type: text/csv" \
  "signed_url"

# JSON request for upload
curl -X PUT \
  -T ./random_array.json \
  -H "Content-Type: application/json" \
  "signed_url"
```