# Для напарника: что изменилось во фронтенде и как с этим работать

Короткая версия: **фронтенд теперь работает на реальном бэкенде**, все экраны кейса и ext-фич готовы, заглушек
«Раздел появится на следующем этапе» больше нет. Твои экраны остались твоими, их поведение не менялось;
правки в твоих файлах — только в «точках подключения» (список ниже) и в тех местах, о которых договорились с Даниилом.
Прочитай этот файл целиком перед первой правкой — так ничего не сломаем на защите.

Ветка: **`feature`** (ветки `main` нет). Все изменения пришли через PR #1–#37, история PR — на GitHub.

---

## 1. Как запустить

```sh
docker compose up          # Postgres + бэкенд (:8000, Swagger /docs) + фронт (:5173) — всё сразу
```

- Через 1–2 минуты: http://localhost:5173. Вход — твой экран `/login` (выбор роли) **или** плавающая кнопка **DEMO**
  справа внизу: вход за любого из 8 персонажей, «+2 дня» (перевод времени), «Сброс данных».
- Порт занят — `DB_PORT=5433 API_PORT=8001 WEB_PORT=5174 docker compose up`.
- Правки в `src/` подхватываются сразу (в docker включён опрос файлов, `VITE_USE_POLLING`).
- **Твой режим на моках никуда не делся:** `npm ci && npm run dev` без `VITE_API_URL` — как раньше, данные в localStorage.

### Кто есть в seed (пароль у всех `demo1234`)

| login | Роль | Страна | Что показывает |
|---|---|---|---|
| `aigerim` | Сотрудник | KZ | Главный персонаж: отпуск на согласовании, «Зарплата по факту» 84 000 ₸, 1 из 2 курсов для SORT-2 |
| `nurlan` | Сотрудник | KZ | 2 отказа с причинами, вопрос к HR без ответа |
| `asel` | Сотрудник | KZ | Другая смена (руководитель Ерлан её не видит) |
| `erlan` | Руководитель | KZ | Руководитель Айгерим и Нурлана |
| `gulnara` | Руководитель | KZ | Руководитель Асель; «пустой» пользователь для пустых состояний |
| `daniyar` | HR | KZ | Реестр, сотрудники, радар, политики, пробелы базы |
| `bakyt` | Сотрудник | KG | Другая страна: другие сроки, лимиты, база AI |
| `aibek` | Руководитель | KG | Руководитель Бакыта |

Твой `/login` по роли входит за «основного» персонажа роли: Сотрудник → Айгерим, Руководитель → Ерлан, HR → Данияр.

---

## 2. Как устроено: два режима данных

```
src/app/providers/AppProviders.tsx
  VITE_API_URL задан  → createHttpServices()   (src/services/http/  — мой код, реальный API)
  VITE_API_URL пустой → createMockServices()   (src/mocks/          — твой код, как было)
```

- **HTTP-адаптер** (`src/services/http/services.ts`) реализует **твои же интерфейсы** из `src/services/contracts.ts`
  (`auth`, `profiles`, `leaveRequests`, `notifications`). Твои экраны не знают, откуда данные.
- Что адаптер делает поверх API (важно, если будешь менять модели):
  - история заявки — только смены статуса (служебные события бэкенда показывают ext-бейджи);
  - остаток отпуска `leaveBalance.days` = **доступно с учётом заявок на рассмотрении** (требование кейса), `asOf` = сегодня;
  - уведомления ext-фич без `target` получают цель из ссылки (`link`), см. раздел 6;
  - токен — `sessionStorage['jana.api-token.v1']`, роль — твой `jana.demo-role.v1`; на 401 токен сбрасывается → `/login`.
- Бэкенд: `backend/` (FastAPI + Postgres). Контракт всех эндпоинтов — `docs/API_CONTRACT.md`, Swagger — http://localhost:8000/docs.

---

## 3. Что лежит в `src/modules/` (мой код)

Реестр: `src/modules/index.ts` — **одна строка на модуль**. Ядро: `src/modules/ext-core/`.

| Модуль | Что делает | Где видно |
|---|---|---|
| `ext-core` | реестр модулей и слотов, `ExtSlot`, API-хук `useApi`, i18n (RU/KZ), формат денег и дат (Алматы), `ext.css` | — |
| `academy` | Jana Academy: каталог, курс, уроки, тест, результат; назначение курсов; «Назначенное обучение» в профиле | `/academy…`, `/hr/learning`, `/manager/learning`, профиль |
| `ai-jana` | чат AI Jana с источниками, честный отказ, «Спросить HR»; страница источника | `/ai-jana`, `/knowledge/:id` |
| `ext-guarantees` | «Мои гарантии» на главной, бейдж срока в списке/карточке, причина отказа в окне решения | главная, заявки |
| `ext-wage` | «Зарплата по факту»: вывод, подтверждение, «Почему столько» | `/wage`, главная |
| `ext-hr` | HR-пульт: радар удержания, счётчик, рентген; рентген «по себе» для руководителя | `/hr`, `/manager/xray` |
| `ext-ladder` | «Открытая лестница» грейдов | профиль |
| `ext-policies` | политики по странам (сроки, лимиты) | `/hr/policies` |
| `ext-grievance` | обращения (анонимно), входящие HR (обращения + вопросы из AI Jana) | `/grievances`, `/hr/inbox` |
| `ext-kb-gaps` | пробелы базы знаний: группы вопросов, черновик, публикация | `/hr/knowledge` |
| `ext-shifts` | биржа смен | `/shifts` |
| `ext-people` | «Моя команда», профиль сотрудника (чужая команда → «Нет доступа»), сотрудники HR, реестр и карточка заявки HR | `/manager/team`, `/employees/:id`, `/hr/employees`, `/hr/requests…` |
| `ext-documents` | бейдж «Приказ … оформлен в Documentolog» в карточке заявки | карточка заявки |
| `ext-demo` | плавающая демо-панель (только при `DEMO_MODE`) | везде |

### Какие твои заглушки заняты моими экранами

Экраны подменяются **по id из твоего `src/app/routes.ts`**, сам каталог не менялся.

| id | Путь | Модуль |
|---|---|---|
| `academy`, `course`, `lesson`, `result` | `/academy…` | `academy` |
| `assistant`, `source` | `/ai-jana`, `/knowledge/:articleId` | `ai-jana` |
| `hr` | `/hr` | `ext-hr` (HR-пульт) |
| `hr-learning` | `/hr/learning` | `academy` |
| `hr-knowledge` | `/hr/knowledge` | `ext-kb-gaps` |
| `team` | `/manager/team` | `ext-people` |
| `hr-employees`, `hr-requests`, `hr-request` | `/hr/employees`, `/hr/requests`, `/hr/requests/:requestId` | `ext-people` |

**Хочешь сделать свой экран вместо моего** — удали строку с этим id в `screens` нужного модуля (`src/modules/<модуль>/index.ts`),
и заглушка снова твоя. Лучше предупреди Даниила: на мои экраны завязаны e2e-тесты и демо-сценарий.

### Как добавить свой блок в чужую страницу (слоты)

| Слот | Где рендерится | props |
|---|---|---|
| `home.widgets` | `DashboardPage` | — |
| `profile.sections` | `ProfilePage` | — |
| `request.list.badge` | строка `RequestList` | `requestId` |
| `request.card.badges` | строка статуса `RequestDetailPage` | `requestId` |
| `shell.overlay` | `AppShell` поверх всего | — |

Модуль объявляет `slots: { 'home.widgets': [lazy(() => import('./Widget'))] }`, каждый блок рендерится в своём `Suspense`.

---

## 4. Что изменено в твоих файлах

Каждая правка — отдельный коммит `touchpoint:`; полный список с причинами — `docs/TOUCHPOINTS.md`. Кратко:

| Файл | Правка |
|---|---|
| `src/app/providers/AppProviders.tsx` | выбор адаптера HTTP / моки |
| `src/features/leave/model.ts`, `presentation.ts` | статус `Escalated` («Передано HR»); `reasonCode?` в `LeaveDecision` |
| `src/app/routes.ts`, `src/app/router.tsx` | каталог дополняется ext-экранами; перед `PlannedPage` — `extElement(id)` |
| `src/layouts/navigation.ts` | `getNavigation` = твои группы + группа «Сервисы JanaМен» |
| `DashboardPage`, `ProfilePage`, `RequestList`, `RequestDetailPage`, `AppShell` | по одной строке `<ExtSlot …/>` |
| `src/features/leave/components/DecisionPanel.tsx` | при отказе — выбор причины из справочника + комментарий от 10 символов (правило гарантий; в режиме моков поле скрыто) |
| `vite.config.ts` | опрос файлов при `VITE_USE_POLLING=true` (только docker) |
| `tests/leave-flow.spec.ts` | хелпер `login` кликает по видимому варианту роли (на 390 px подпись перекрывала скрытый radio) |
| `README.md` | блок «запуск полной платформы» в начале и раздел «Полная сборка с бэкендом» в конце |

**Не удаляй** эти строки при своих правках — без них пропадут ext-экраны, меню, бейджи или причина отказа.
Если файл переписываешь целиком — перенеси `ExtSlot` и правки из таблицы.

---

## 5. Правила, которые проверяет бэкенд (чтобы не удивляться ошибкам)

- Роли: `Employee | Manager | HRAdmin`; статусы: `Submitted | Approved | Rejected | Escalated | Cancelled`; поля — camelCase.
- **Отказ по заявке только с причиной** из справочника (`GET /api/ext/guarantees/reasons?type=vacation`) и комментарием ≥ 10 символов,
  иначе `REASON_REQUIRED` / `COMMENT_REQUIRED` / `UNKNOWN_REASON`. Флаг `GUARANTEES_REQUIRE_REASON=false` временно отключает.
- **Срок ответа (гарантия):** у новой заявки на отпуск есть `deadlineAt` (KZ 48 ч, KG 72 ч). По истечении — автоодобрение
  («Одобрено по сроку») или передача HR (`Escalated`) — по политике страны.
- Заявка на отпуск: `submissionKey` обязателен (идемпотентность), даты не в прошлом, не больше доступного остатка, без пересечений
  (`INVALID_DATES`, `INSUFFICIENT_BALANCE`, `OVERLAP`). Решение — с `expectedVersion` (`VERSION_CONFLICT` при гонке).
- Руководитель видит **только свою команду** (чужой сотрудник/заявка → 403 даже по прямому id); зарплаты видят только сам человек и HR.
- Анонимное обращение: автор не возвращается никому, кроме самого автора; руководитель обращений не видит вообще.
- Деньги — целые тенге (`int`), формат на экране — `84 000 ₸`. Даты — по Алматы.
- Ошибки всегда `{kind, code, message, messageKey, fieldErrors?, data?}`. Недопустимый ввод (NUL-байт, слишком длинные поля) — 422, не 500.

---

## 6. Уведомления

- Бэкенд присылает готовые `title`/`message` (на языке пользователя) и `titleKey`/`bodyKey`/`params` для перевода на фронте.
- У уведомлений заявок и курсов есть `target` (`request` / `course`). У ext-уведомлений (смены, лестница, пересмотр, пробелы базы)
  `target` нет, есть `link` — адаптер выводит цель из ссылки, иначе ведёт в «Мои заявки».

---

## 7. Тесты

```sh
npm run check                                            # oxlint + TypeScript + build (без предупреждений)
npm run test:e2e                                         # твои тесты на моках (tests/), 25/26 — см. ниже
npx playwright test -c e2e-ext/playwright.config.ts      # мои 72 UI-теста против docker compose (СБРАСЫВАЮТ демо-данные)
cd backend && uv run pytest -q                           # 355 тестов бэкенда
cd backend && uv run python scripts/smoke_api.py         # 113 проверок живого API на Postgres
```

- `e2e-ext/99-demo-scenario.spec.ts` — весь демо-сценарий защиты; `20-case-checklist.spec.ts` — чек-лист кейса через UI
  со скриншотами (`docs/screenshots/case/`). **Если твоя правка ломает их — на защите сломается демо.**
- Мои тесты завязаны на твои тексты и классы: «Проверить заявку», «Отправить заявку», «Подтвердить согласование», «Отклонить»,
  `.request-number`, `.request-status`, `.request-history li`, `.creation-confirmation`, `.decision-complete`, `.role-option-content`,
  подписи полей «Первый день», «Последний день», «Комментарий руководителю». Переименовываешь — поправь и `e2e-ext/`.
- Твой `motion.spec.ts › settle cleanly` падал из-за 1 кадра переполнения при резком сужении окна — см. раздел 9.

---

## 8. Git — как не мешать друг другу

- Работа в своих ветках, короткие PR в `feature`. Перед PR: `git pull`, `npm run check`, мои e2e (хотя бы `99-demo-scenario`).
- **История `feature` переписана 17.10** (убраны служебные строки из сообщений коммитов). Если у тебя есть локальная старая
  `feature` — не пушь её поверх: `git fetch && git switch feature && git reset --hard origin/feature` (свои незапушенные
  коммиты сначала перенеси в отдельную ветку и сделай `rebase` на новую `feature`).
- Общие файлы (`src/modules/index.ts`, словари) — только добавление строк.

---

## 9. Онлайн-версия и что осталось

- **Онлайн:** https://janamen.46.225.85.227.sslip.io — сервер `sellora`, общий Caddy, демо-режим включён. Как обновить — `deploy/README.md`
  (на сервере: `cd ~/projects/janamen && git pull && docker compose -p janamen -f deploy/docker-compose.prod.yml --env-file .env up -d --build`).
- Твои изменения из `bond/feature` (KZ, вход по логину, «Мои заявки», решения HR, правила MVP, презентация) смержены в `feature` (PR #39)
  и проверены: pytest 378, smoke 113/113, демо-сценарий и чек-лист кейса — локально и на сервере.
- Плавающий тест: `tests/leave-flow.spec.ts › separate Employee and Manager tabs` иногда падает под нагрузкой (отдельно 3/3).
- Ключа Anthropic на сервере пока нет — AI Jana отвечает фрагментами базы. Как добавить — `deploy/README.md`.

---

## 10. Документы

| Файл | Что там |
|---|---|
| `README.md` | запуск, экраны, реализовано / смоделировано / развитие |
| `backend/README.md` | бэкенд: запуск, учётки, демо-сценарий, флаги фич |
| `docs/API_CONTRACT.md` | все эндпоинты, форматы, ошибки, расхождения с твоими контрактами |
| `docs/ARCHITECTURE.md` | схема и места интеграций 1С:ЗУП, Documentolog, банка |
| `docs/TOUCHPOINTS.md` | все правки в твоих файлах с причинами |
| `docs/CASE_CHECKLIST.md` | соответствие кейсу, каждый пункт с тестом |
| `docs/FINAL_QA.md` | финальная проверка: что проверено, баги, время шагов демо, что делать, если на демо что-то упадёт |
| `docs/screenshots/` | скриншоты всех экранов (1440 и 375 px), шаги кейса — в `case/`, фичи — в `features/` |

Вопросы — Даниилу.
