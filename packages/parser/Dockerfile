FROM node:20-alpine3.19 AS dependencies

WORKDIR /app

RUN apk add --no-cache bash curl dos2unix

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

FROM dependencies AS build

WORKDIR /app

COPY . ./

RUN yarn build

FROM node:20-alpine3.19 AS production

WORKDIR /app

ENTRYPOINT [ "yarn", "start:prod" ]

EXPOSE 8181