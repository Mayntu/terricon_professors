# Фронтенд для сервера: production-сборка Vite → статика в nginx (SPA: неизвестные пути → index.html)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Адрес API вшивается в сборку (публичная переменная Vite, секретов здесь нет)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
