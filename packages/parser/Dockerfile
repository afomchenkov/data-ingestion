# stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache bash curl dos2unix

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# stage 2: runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

EXPOSE 8282

CMD ["node", "dist/main.js"]
