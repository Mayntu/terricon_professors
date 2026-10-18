# Деплой на сервер (sellora)

Адрес: **https://janamen.46.225.85.227.sslip.io** — HTTPS выпускает общий Caddy сервера, DNS не нужен (sslip.io).

## Как устроено

```
Интернет → caddy-caddy-1 (общий, :80/:443, ~/projects/caddy)
             ├─ /api/*  → janamen-backend-1:8000   (FastAPI, миграции и seed при старте)
             └─ /*      → janamen-frontend-1:80    (nginx со статикой Vite)
           janamen-db-1 (Postgres 16, только внутри сети janamen_default)
```

Наружу проект порты не публикует. Caddy подключён к сети `janamen_default`
(в `~/projects/caddy/docker-compose.yml` — сеть `janamen_net`).

## Файлы на сервере

- код: `~/projects/janamen` (клон https://github.com/Mayntu/terricon_professors, ветка `feature`);
- `~/projects/janamen/.env` (права 600, в git нет): `PUBLIC_HOST`, `JWT_SECRET`, `POSTGRES_PASSWORD`, `DEMO_MODE`, `ANTHROPIC_API_KEY`.

## Обновить версию

```sh
ssh sellora
cd ~/projects/janamen && git pull
docker compose -p janamen -f deploy/docker-compose.prod.yml --env-file .env up -d --build
```

Миграции применяются сами при старте бэкенда. Сбросить демо-данные — кнопка DEMO → «Сброс данных»
или `curl -X POST https://janamen.46.225.85.227.sslip.io/api/demo/reset`.

## Добавить ключ Anthropic (AI Jana в режиме LLM)

```sh
ssh sellora
cd ~/projects/janamen && echo 'ANTHROPIC_API_KEY=sk-ant-…' >> .env
docker compose -p janamen -f deploy/docker-compose.prod.yml --env-file .env up -d backend
```

## Логи и остановка

```sh
docker compose -p janamen -f deploy/docker-compose.prod.yml logs -f backend
docker compose -p janamen -f deploy/docker-compose.prod.yml down        # данные БД сохраняются (том db-data)
```
