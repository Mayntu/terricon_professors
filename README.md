# JanaМен · JANA FLOW

Основа frontend внутренней HR-платформы. Этап 01: инфраструктура интерфейса,
дизайн-токены, сервисные контракты и карта экранов. Основные экраны, backend
и безопасная авторизация **ещё не реализованы**.

## Запуск

Node.js 22.12+ (проверено на 22.21.0), npm. Выполнять в `terricon_professors`:

```sh
npm ci
npm run dev
```

В Windows PowerShell при блокировке npm.ps1 использовать `npm.cmd ci` и
`npm.cmd run dev`; менять execution policy системы не требуется.
Открыть локальный URL из вывода Vite. Секреты, env-файл и сервер не нужны.

```sh
npm run typecheck  # TypeScript
npm run lint       # Oxlint
npm run check      # lint + TypeScript + production build
npm run preview    # preview готового dist, после build
```

`npm run build` создаёт `dist/`. Для размещения SPA настроить fallback нефайловых
URL на `index.html`, чтобы прямой вход на вложенный маршрут работал.
Публикация в текущем этапе не выполнялась.

## Что подготовлено

- React 19, TypeScript 6 (strict), Vite 8; основа — официальный React TS scaffold.
- Tailwind CSS 4 через Vite-плагин, CSS custom properties, авторские примитивы.
- React Router 7: временная стартовая страница, зарезервированные URL и 404.
- Motion for React с reduced motion; GSAP/@gsap/react для будущих timelines.
- Lucide React; локальные Manrope Variable и IBM Plex Mono с кириллицей.
- Контракты сервисов и модели без API-вызовов и mock-авторизации.
- Временная оболочка: skip link, focus при переходе, responsive grid.

Сейчас можно открыть основу, перейти на техническую заглушку и вернуться. Нет
тестовых аккаунтов, бизнес-данных, сохранения заявок, согласования, курсов и AI-ответов.
Mock API разрешены будущим этапам, но ещё не реализованы.

## Структура

```text
docs/
  DESIGN_SYSTEM.md     # Палитра, типографика, сетка, motion
  SCREEN_MAP.md        # Роли, экраны, переходы и состояния
src/
  app/                # App, провайдеры, router, каталог маршрутов
  components/         # brand, ui, motion: общие примитивы
  features/           # identity, leave, academy, assistant, notifications
  layouts/            # Временная оболочка; далее продуктовые layouts
  pages/              # foundation, planned, not-found
  services/           # Контракты; далее HTTP-адаптеры
  mocks/              # Правила будущих demo-адаптеров
  lib/                # Точечная интеграция GSAP
  styles/             # CSS tokens, Tailwind bridge, fonts, motion
  main.tsx
public/
  favicon.svg
AGENTS.md             # Постоянные правила разработки
```

UI → feature hooks → сервисный контракт → будущий mock/HTTP adapter.
Будущий ASP.NET Core backend отвечает за авторизацию, заявки и PostgreSQL, а также
за адаптеры 1С:ЗУП и Documentolog. Браузер не соединяется с ними напрямую.
Подробнее: [сервисная граница](src/services/README.md).

## Решения и ограничения

Общая заглушка обслуживает будущие маршруты; это не реализация экранов.
Role metadata — спецификация доступа, не защита. HTTP, auth, query cache, store,
form library и UI kit не добавлены без сценария, которому они нужны.
Шрифты self-hosted; ключи API в frontend не допускаются. Лицензии шрифтов
содержатся в соответствующих пакетах Fontsource.

При подготовке доступен и использован Context7. Playwright MCP и Figma MCP не
подключены; Figma-макета также нет. Проверку другими браузерными средствами
отделять от Playwright MCP и не заявлять его использованным.

Перед следующими задачами читать [AGENTS.md](AGENTS.md),
[дизайн-систему](docs/DESIGN_SYSTEM.md) и [карту экранов](docs/SCREEN_MAP.md).
Основания: [Vite](https://vite.dev/guide/),
[Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite),
[React Router](https://reactrouter.com/start/declarative/routing),
[Motion](https://motion.dev/docs/react-accessibility), [GSAP](https://gsap.com/resources/React/).
