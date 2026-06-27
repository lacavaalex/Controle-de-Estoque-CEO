FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

# pg_isready: o entrypoint usa pra esperar o banco subir.
RUN apk add --no-cache postgresql-client

# drizzle-kit (migrate) e tsx (seed) são devDeps, mas o entrypoint precisa deles.
# Por isso o npm ci roda antes do NODE_ENV=production — senão o npm pula as
# devDependencies e dá "drizzle-kit: not found".
COPY package.json package-lock.json ./
RUN npm ci --include=dev
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
