#!/usr/bin/env bash
set -e

AWS_REGION=eu-west-1

ECR_PARSER="${ECR_APP_PARSER_URL}"   # from terraform output
ECR_UPLOADER="${ECR_APP_UPLOADER_URL}"

# login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_PARSER
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_UPLOADER

# build & tag
docker build -t app-parser:latest ./docker/packages/parser
docker tag app-parser:latest ${ECR_PARSER}:latest

docker build -t app-uploader:latest ./docker/packages/uploader
docker tag app-uploader:latest ${ECR_UPLOADER}:latest

# push
docker push ${ECR_PARSER}:latest
docker push ${ECR_UPLOADER}:latest
