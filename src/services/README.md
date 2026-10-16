# Сервисная граница

`contracts.ts` — интерфейсы frontend. `IAuthService`, `IProfileService`,
`ILeaveRequestService`, `INotificationService` реализованы mock-адаптером.
HTTP-клиента и сервера нет. Контракты не являются окончательной спецификацией API.

`demo-session.ts` отдельно задаёт интерфейс хранения выбранной демо-роли. Его browser
adapter живёт в mocks и не реализует серверный SessionService. UI явно сообщает демо-режим.

Направление зависимости:

```text
pages → features (UI / hooks) → service contracts
                                   ↑
                        mock adapter | HTTP adapter
                                         ↓
                              ASP.NET Core → PostgreSQL
                                         ↓
                              1С:ЗУП / Documentolog
```

Будущие реализации подключать в composition root (`app/providers`), а не выбирать
режим работы внутри кнопок и страниц. Mock-реализации держать в `mocks/`, реальные
адаптеры — в `services/http/`. Не делать автоматический fallback на mock при ошибке API.

`ServiceResult<T>` задаёт явные состояния успеха/ошибки. Адаптер нормализует сетевые
ошибки и будущие ASP.NET ProblemDetails в `ServiceProblem`; отмену через AbortSignal
обрабатывает как отмену, без уведомления об ошибке. Компоненты не разбирают HTTP-коды.

`getById`, `decide`, `getSource` в будущем должны проверяться сервером для каждого
объекта. Role в маршруте, hidden-кнопка и TypeScript readonly не являются защитой.
Сервер выводит пользователя из сессии, не доверяет employeeId/role из клиента.
`expectedVersion` предназначен для обнаружения повторного или устаревшего решения.
Длительность отпуска, календарь, баланс и допустимость перехода подтверждает сервер.

В этом этапе эти условия проверяет mock-сервис. `submit` принимает `submissionKey`
для идемпотентности повторной отправки формы. `decide` принимает только Approved
или Rejected (с обязательной причиной), и `expectedVersion`. Автор определяется
из текущей демо-роли, не из поля формы. `listMine` возвращает своё, `listTeam` — свою
команду руководителя. Личные данные Manager доступны в `/dashboard` и `/requests`.

`ApplicationServices` внедряется через `ServicesContext` в composition root.
`useServiceQuery` подписывается на revision через useSyncExternalStore, игнорирует
устаревшие async-ответы и не показывает данные другого пользователя/запроса.
Mock не создаёт искусственную задержку; UI умеет обрабатывать pending для будущего API.
Mock возвращает весь малый реестр (`nextCursor: null`); серверная пагинация остаётся
на будущий этап. При переходе на HTTP механизм invalidation также заменяется адаптером.

Даты отпуска — ISO calendar dates `YYYY-MM-DD`, события — ISO 8601 timestamps с зоной.
Строковые типы не заменяют runtime-валидацию входящих DTO. Не вычислять кадровые правила
из предположений. Детали входа, хранения сессии и API endpoints согласуются на этапе backend.
Vite-переменные публичны: секреты AI, базы данных и интеграций не помещать в frontend.

HR-команды, тесты Academy и транспортный API добавлять по мере реализации: здесь
намеренно нет методов-заглушек, которые выдают несуществующие операции за работающие.
