# node:20-slim (Debian/glibc) e não alpine: o Vite 8 puxa o binário nativo do
# lightningcss e em alpine (musl) o npm ci não resolve o .node — quebra o build.
FROM node:20-slim AS build
WORKDIR /app

# Subcaminho do deploy (precisa de barra no fim) e base da API que o front chama.
ARG APP_BASE=/estoque-ho/
ARG VITE_API_BASE=/estoque-ho/api
ENV VITE_API_BASE=${VITE_API_BASE}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# imagem final só para copiar o dist para /output
FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/dist /dist
CMD ["sh", "-c", "rm -rf /output/* && cp -r /dist/. /output/"]