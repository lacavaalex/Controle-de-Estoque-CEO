# node:20-slim (Debian/glibc) e não alpine: o Vite 8 puxa o binário nativo do
# lightningcss e em alpine (musl) o npm ci não resolve o .node — quebra o build.
FROM node:20-slim AS builder
WORKDIR /app

# Subcaminho do deploy (precisa de barra no fim) e base da API que o front chama.
ARG APP_BASE=/estoque-ho/
ARG VITE_API_BASE=/estoque-ho/api
ENV VITE_API_BASE=${VITE_API_BASE}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --base="${APP_BASE}"

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/estoque-ho
EXPOSE 80
