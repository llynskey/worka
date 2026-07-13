FROM node:22-alpine AS build
WORKDIR /app

COPY Worka.WebApp/client/package*.json ./
RUN npm ci

COPY Worka.WebApp/client/ ./

ARG EXPO_PUBLIC_API_URL=/api
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
ENV CI=1

RUN npx expo export --platform web

FROM caddy:2-alpine AS final
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN test -f /srv/index.html
