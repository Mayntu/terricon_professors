# Точки подключения во фронтенде напарника

Каждое изменение файла напарника — отдельный коммит с префиксом `touchpoint:`. Всё остальное лежит в моих
папках: `src/services/http/`, `src/modules/`. Его файлы не переформатированы, правки минимальные.

| # | Файл напарника | Что изменено | Зачем |
|---|---|---|---|
| 1 | `src/app/providers/AppProviders.tsx` | Выбор адаптера: `VITE_API_URL` задан → `createHttpServices`, иначе моки | Данные с бэкенда; без переменной его тесты на моках работают как раньше |
| 2 | `src/features/leave/model.ts`, `src/features/leave/presentation.ts` | `'Escalated'` в `LeaveStatus`, подпись «Передано HR», следующий шаг «Решение: HR» | Статус гарантий: срок руководителя истёк, заявка передана HR (разрешено Даниилом) |
| 3 | `src/app/routes.ts`, `src/app/router.tsx` | Каталог экранов дополняется `extPlannedScreens()`; в `DemoScreen` перед заглушкой — `extElement(screen.id)` | Маршруты ext-экранов, а также экраны Academy и AI Jana вместо заглушек `PlannedPage` |
| 4 | `src/layouts/navigation.ts` | `getNavigation(role)` = его группы + `extNavigation(role)`; тело функции переименовано в `baseNavigation` | Пункты меню ext-фич отдельной группой «Сервисы JanaМен» (по ролям и флагам) |
| 5 | `src/pages/dashboard/DashboardPage.tsx` | `<ExtSlot name="home.widgets" />` после блока «В движении» | Блоки «Мои гарантии», «Зарплата по факту» на главной |
| 6 | `src/pages/profile/ProfilePage.tsx` | `<ExtSlot name="profile.sections" />` после карточки профиля | «Открытая лестница» в профиле |
| 7 | `src/features/leave/components/RequestList.tsx` | `<ExtSlot name="request.list.badge" requestId=…/>` рядом со статусом | Бейдж срока («Ответ до …») в списке заявок |
| 8 | `src/pages/requests/RequestDetailPage.tsx` | `<ExtSlot name="request.card.badges" requestId=…/>` в строке статуса | Бейдж срока в карточке заявки |
| 9 | `src/features/leave/components/DecisionPanel.tsx`, `src/features/leave/model.ts` | При отказе — `<RejectReason>` (причина из справочника), кнопка неактивна без причины и комментария от 10 символов; `reasonCode?` в `LeaveDecision` и в вызове `decide` | Гарантии: отказ только с причиной. В режиме моков поле не показывается и не требуется |
| 10 | `src/layouts/AppShell.tsx` | `<ExtSlot name="shell.overlay" />` после мобильного меню | Плавающая демо-панель (показывается только при `DEMO_MODE`) |
| 11 | `README.md` | Раздел «Полная сборка с бэкендом» в конце файла; его текст не тронут | Запуск с бэкендом, список ext-экранов, реализовано / смоделировано / развитие |
| 12 | `vite.config.ts` | `server.watch.usePolling` при `VITE_USE_POLLING=true` (задано только в docker-compose) | В docker на macOS правки существующих файлов не доходили до Vite |
| 13 | `tests/leave-flow.spec.ts` | Хелпер `login`: клик по видимому варианту роли вместо `check()` скрытого radio | Тест падал на 390 px из-за перекрытия подписью; поведение приложения верное (разрешено Даниилом) |

## Для напарника: какие заглушки заняты ext-экранами

Экраны подменяются по id из `src/app/routes.ts` через реестр `src/modules/index.ts`, файлы напарника для этого не правятся.
Если будешь делать свой экран с тем же id — убери соответствующую строку из модуля, и заглушка снова станет твоей.

| id заглушки | Путь | Чей экран сейчас | Модуль |
|---|---|---|---|
| `academy`, `course`, `lesson`, `result` | `/academy…` | Даниила | `src/modules/academy` |
| `assistant`, `source` | `/ai-jana`, `/knowledge/:id` | Даниила | `src/modules/ai-jana` |
| `hr` | `/hr` | Даниила (HR-пульт) | `src/modules/ext-hr` |
| `hr-learning` | `/hr/learning` | Даниила | `src/modules/academy` |
| `hr-knowledge` | `/hr/knowledge` | Даниила (пробелы базы) | `src/modules/ext-kb-gaps` |
| `team` | `/manager/team` | Даниила (сценарий 3 кейса) | `src/modules/ext-people` |
| `hr-employees`, `hr-requests`, `hr-request` | `/hr/employees`, `/hr/requests…` | Даниила | `src/modules/ext-people` |
