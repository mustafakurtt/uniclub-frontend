# syntax=docker/dockerfile:1

# ---- Stage 1: build the static bundle ----
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Vite bakes env vars at build time — pass the API URL as a build arg.
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN bun run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA-aware config (client-side routing fallback + asset caching).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
