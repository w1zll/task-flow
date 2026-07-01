# TaskFlow - full-stack таск-трекер для команд

TaskFlow - таск-трекер с workspace-моделью, канбан-досками, командами, ролями доступа, расширенными деталями задач, чеклистами, вложениями, комментариями, упоминаниями, уведомлениями, realtime-синхронизацией, PWA read-only offline mode, JWT-auth через httpOnly cookies и современной frontend-архитектурой на Next.js App Router.

**Online версия:** <https://task-flow-silk-delta.vercel.app/>

## Что показывает проект

- Опыт с современным frontend: Next.js App Router, TypeScript, MUI, TanStack Query, Zustand, Socket.IO, i18n.
- Опыт с PWA и offline UX: installable manifest, custom Service Worker, Cache API, IndexedDB, persisted TanStack Query cache, offline navigation fallback.
- Опыт с backend: NestJS, TypeORM, PostgreSQL, Guards, DTO validation, Swagger/OpenAPI, WebSocket gateway.
- Понимание auth/security: access/refresh JWT в httpOnly cookies, refresh-token rotation, отзыв сессий, WS-auth.
- Работа с realtime и отказоустойчивостью: optimistic UI, ack/rollback, очередь несохраненных socket-мутаций.
- Умение проектировать read-only offline mode: просмотр сохраненных workspace/boards/tasks без сети, отключение мутаций, восстановление online-состояния и понятные ограничения для пользователя.
- Умение поддерживать большой frontend: декомпозиция компонентов, feature-based структура, типизированные API-клиенты, тесты.
- Продуктовое мышление: demo-flow, фильтры, saved views, роли, teams, приглашения, чеклисты, вложения, комментарии, уведомления, loading feedback, empty/error states, ru/en локализация.

## Основные возможности

### Workspace как основная оболочка

- Несколько рабочих пространств на пользователя.
- Переключение активного workspace.
- Workspace overview с быстрым доступом к доскам и задачам.
- Навигация внутри workspace: обзор, доски, мои задачи, команды, настройки.
- Участники workspace с ролями `owner`, `admin`, `member`.
- Управление участниками и удаление workspace с проверками прав.

### Доски и задачи

- Канбан-доски внутри workspace.
- Drag and drop колонок и задач через `@hello-pangea/dnd`.
- Scrum-шаблон доски и пустая доска при создании.
- Карточки задач с приоритетом, дедлайном, метками, исполнителем, командой и статусом выполнения.
- Модальное окно задачи для редактирования деталей и обсуждения.
- Расширенные детали задачи: команда, оценка в часах, story points, дата завершения и служебные метаданные.
- Чеклисты внутри задачи с назначением исполнителя на пункт, отметками выполнения и ручным порядком.
- Вложения к задачам: загрузка изображений/PDF через кнопку или drag-and-drop, прогресс загрузки, предпросмотр изображений, скачивание/открытие и оптимистичное удаление.
- Быстрое завершение задачи с сохранением даты выполнения.
- Подсветка задачи при переходе из раздела "Мои задачи".

### Фильтры, сортировка и сохраненные виды

- Фильтрация задач по поиску, исполнителю, команде, приоритету, статусу и меткам.
- Быстрые фильтры "Мои задачи" и "Мои команды".
- Сортировка по дедлайну, приоритету, дате создания, обновлению и исполнителю.
- Сохраненные виды доски (`BoardView`) с собственными фильтрами и сортировкой.
- Свертываемая панель фильтров на desktop.
- Видимый loading feedback при применении фильтров.
- Автоматическое отключение drag and drop в отфильтрованном виде, чтобы не ломать порядок задач.
- Фильтр задач с непрочитанными уведомлениями пользователя.

### Команды

- Команды внутри workspace.
- Цвет команды и описание.
- Управление участниками команды.
- Привязка задач к команде.
- Фильтрация задач по конкретной команде или по командам текущего пользователя.

### Совместная работа и роли

- Доступ к доске по ролям `owner`, `editor`, `viewer`.
- Capabilities модель на backend: `canReadBoard`, `canEditBoardContent`, `canManageBoardMembers`, `canDeleteBoard`, `canManageColumns`, `canUseWhiteboard`, `canManageBoardSettings`.
- Viewer работает в read-only режиме: интерфейс скрывает или блокирует действия, которые требуют прав на редактирование.
- Шаринг доски с участниками workspace.
- Управление ролями участников доски.

### Публичные workspace invite-ссылки

- Создание invite-ссылок для workspace.
- Preview приглашения для неавторизованного пользователя.
- Accept flow для авторизованных пользователей.
- Pending invite flow: если пользователь пришел по ссылке без аккаунта, токен сохраняется до login/register и применяется после входа.
- Аудит событий invite flow на backend.

### Комментарии, упоминания и уведомления

- Комментарии в модальном окне задачи с realtime-синхронизацией между открытыми окнами.
- Упоминания участников доски через mentions autocomplete.
- Персональные уведомления для упоминаний, назначения задачи, изменений задач команды и добавления пользователя на доску.
- Notification bell в header с unread count, списком уведомлений и действиями "прочитать" / "прочитать все".
- Deep links из уведомлений открывают нужную задачу через URL `taskId`, закрытие задачи очищает URL.
- Viewer может читать комментарии, но не может писать, редактировать или удалять их.

### Realtime

- Socket.IO синхронизация состояния доски.
- JWT-аутентификация WebSocket-соединения.
- События для создания, обновления, перемещения, переупорядочивания и удаления задач.
- События для создания, редактирования и удаления комментариев.
- Пользовательские socket-room события для уведомлений и счетчика непрочитанных.
- Activity-события для чеклистов и вложений инвалидируют данные доски в открытых вкладках.
- Optimistic UI с ожиданием server ack.
- Rollback при ошибке или отсутствии надежного соединения.
- In-memory очередь несохраненных socket-мутаций: после восстановления связи пользователь сам выбирает, применить изменения или отказаться.

### PWA и read-only offline mode

- Installable PWA с `manifest.webmanifest`, `standalone` display mode, theme color, favicon, apple touch icon и maskable/any иконками 192/512.
- Custom Service Worker без внешних PWA-оберток: отдельные cache buckets для app shell, static assets, navigation pages и Next.js App Router RSC payloads.
- App shell cache прогревает `/`, `/workspaces`, manifest, favicon и PWA-иконки, чтобы приложение открывалось из установленного ярлыка.
- Navigation cache использует network-first стратегию: online обновляет сохраненную HTML-страницу, offline отдает сохраненный route или понятный fallback.
- RSC payload cache отдельно сохраняет App Router payload-запросы, чтобы offline-переходы в Next.js не ломались на `_rsc`/`rsc` fetch.
- Persisted TanStack Query cache хранится в IndexedDB: сохраняются workspaces, список досок и детали открытых досок; приватные invite-данные не персистятся.
- Offline режим намеренно read-only: задачи, колонки, участники, команды, настройки, demo reset и другие write-операции блокируются на уровне UI, Axios interceptor и socket mutations.
- Кешированные доски остаются кликабельными без сети, незакешированные доски и разделы workspace становятся disabled и показывают объясняющий snackbar.
- Online/offline runtime показывает верхнюю offline-плашку, проверяет восстановление связи через `/api/auth/me`, снимает offline-marker без перезагрузки и инвалидирует сохраненные данные после reconnect.
- Auth UI переживает offline reload: данные пользователя дублируются в localStorage для header, при этом JWT остаются в httpOnly cookies.
- Для медленных переходов добавлен route progress bar под header, чтобы пользователь видел, что навигация выполняется.

### Аналитика и демо

- Аналитика выполненных задач: daily, weekly, monthly, summary.
- Сводка выполненных вовремя и после дедлайна.
- Demo workspace для быстрой демонстрации проекта.
- Demo login и reset demo workspace на backend.
- Локализованная welcome/demo-доска с задачами и историей выполнений.

### Профиль, сессии и файлы

- Профиль пользователя.
- Загрузка и сброс аватара.
- Просмотр активных сессий.
- Отзыв отдельных сессий.
- Storage abstraction для файлов: local storage, Cloudinary, ImageKit.
- Вложения задач используют тот же StorageAdapter; лимит файла - 10 MB, допустимы изображения и PDF.
- Ограничения на тип и размер аватара.

### Локализация и UX

- Русский и английский интерфейс через `next-intl`.
- Определение локали через cookies и headers.
- Темная и светлая темы.
- Loading, empty и error states для основных сценариев.
- Desktop и mobile navigation внутри workspace.
- Декомпозированные frontend-компоненты вместо крупных монолитных файлов.

## Технологический стек

### Frontend

| Технология | Задача |
| --- | --- |
| Next.js App Router | Маршрутизация, SSR, protected dynamic pages, API route для cache revalidation |
| React + TypeScript | UI и строгая типизация |
| MUI | Компоненты, темы, адаптивный интерфейс |
| TanStack Query v5 | Server state, cache, mutations, optimistic updates |
| Zustand | Auth/UI/theme state |
| Socket.IO Client | Realtime-доска, комментарии и уведомления |
| Axios | HTTP-клиент с cookie-based auth flow |
| Web App Manifest + Service Worker | Installable PWA, app shell cache, offline navigation fallback |
| Cache API + IndexedDB | Кеш HTML/RSC/assets и persisted TanStack Query cache для offline read-only режима |
| next-intl | ru/en локализация |
| @hello-pangea/dnd | Drag and drop колонок и задач |
| Jest + Testing Library | Unit/component-level проверки |
| openapi-typescript | Генерация frontend-типов из Swagger/OpenAPI |

### Backend

| Технология | Задача |
| --- | --- |
| NestJS | Модульная backend-архитектура |
| TypeORM | Работа с PostgreSQL, entities, migrations |
| PostgreSQL | Основная база данных |
| Passport + JWT | Auth, guards, access/refresh sessions |
| Socket.IO | WebSocket gateway для realtime |
| Swagger/OpenAPI | Документация и контракт API |
| class-validator | Валидация DTO |
| bcrypt | Хеширование паролей и refresh-токенов |
| Jest | Unit tests backend-сервисов и guards |

## Архитектура

### Доменная модель

```text
User
  -> Notification
  -> WorkspaceMember
      -> Workspace
          -> Board
              -> Column
                  -> Task
                      -> TaskComment
                          -> Mention
          -> Team
              -> TeamMember
          -> WorkspaceInvite

Board
  -> BoardMember
  -> BoardView
  -> BoardActivity
```

Workspace является основной границей продукта. Доски, команды, участники, приглашения, задачи, комментарии, уведомления и настройки живут внутри workspace. При этом board roles отделены от workspace roles: пользователь может быть участником workspace, но иметь отдельную роль на конкретной доске.

### Frontend-структура

```text
frontend/src
  app/       Next.js routes, layouts, providers, API routes
  widgets/   крупные пользовательские сценарии: kanban, workspaces, boards
  features/  auth flow и feature-level UI
  shared/    api, hooks, lib, queries, store
```

Ключевые frontend-решения:

- protected страницы используют dynamic rendering и `force-no-store`, чтобы не отдавать приватные данные из cache;
- серверные страницы предварительно кладут данные в TanStack Query cache через hydration;
- клиентские mutations инвалидируют query cache и синхронизируются с WebSocket-событиями;
- UI state отделен от server state: модалки, drag state, тема и auth живут в Zustand, данные API - в TanStack Query;
- фильтры доски синхронизированы с URL, чтобы вид можно было шарить и восстанавливать после refresh.

### PWA/offline архитектура

PWA слой сделан как часть архитектуры приложения, а не как декоративный manifest. Он решает две разные задачи: открыть приложение без сети и показать корректные сохраненные данные в read-only режиме.

```text
manifest.webmanifest
  -> installability metadata, icons, standalone mode

public/sw.js
  -> app shell cache
  -> static asset cache
  -> navigation HTML cache
  -> Next.js App Router RSC payload cache

OfflineRuntime
  -> service worker registration
  -> online/offline detection
  -> reconnect probe
  -> offline banner and reconnect snackbar
  -> warm navigation cache for visited boards

TanStack Query persistence
  -> IndexedDB
  -> workspaces / boards / board details
  -> cache buster and TTL

Offline-aware UI
  -> disabled uncached navigation
  -> read-only capabilities
  -> blocked writes in Axios and Socket.IO mutations
```

Ключевые PWA-файлы:

- `frontend/public/manifest.webmanifest` - installable metadata: `start_url`, `scope`, `display`, theme colors, icons.
- `frontend/public/sw.js` - custom Service Worker и стратегии кеширования.
- `frontend/public/icons/*` - PWA icons, maskable icons, apple touch icon и общий логотип приложения.
- `frontend/src/shared/ui/OfflineRuntime.tsx` - регистрация Service Worker, offline banner, reconnect probe, warm cache.
- `frontend/src/shared/lib/query-persistence.ts` - сохранение TanStack Query cache в IndexedDB.
- `frontend/src/shared/lib/offline.ts` - единый online/offline marker и `OfflineReadOnlyError`.
- `frontend/src/shared/lib/offline-navigation-cache.ts` - ручной прогрев navigation cache для досок и workspace routes.
- `frontend/src/shared/hooks/useCachedBoardDetailIds.ts` - определение, какие доски реально доступны offline.
- `frontend/src/shared/api/client.ts` - Axios interceptor, который запрещает write-запросы в offline.
- `frontend/src/shared/lib/boardSocketMutations.ts` - запрет socket write-мутаций в offline read-only режиме.

Пайплайн работы:

1. Пользователь открывает приложение online.
2. Browser читает manifest из Next.js metadata и получает installability-сигналы.
3. `OfflineRuntime` в production secure context регистрирует `/sw.js`.
4. Service Worker на `install` кеширует app shell и базовые assets.
5. Пользователь открывает workspace и доски; TanStack Query получает данные API.
6. Query cache сохраняется в IndexedDB с TTL и cache buster.
7. Runtime прогревает navigation cache для `/workspaces`, текущего workspace route и досок, у которых уже есть детали в query cache.
8. При потере сети `offline.ts` выставляет offline marker, TanStack Query переводится в offline mode, UI показывает read-only banner.
9. Кешированные доски можно открыть через сохраненный HTML/RSC route и IndexedDB query data.
10. Незакешированные доски, профиль, смена языка и workspace-разделы без гарантированного cache блокируются с понятным сообщением.
11. Все write-операции блокируются до сети.
12. После восстановления связи runtime пробует `/api/auth/me`, снимает offline marker, показывает snackbar и инвалидирует `workspaces`/`boards`.

### Backend-структура

```text
backend/src
  auth/        login, register, refresh rotation, sessions, ws token
  workspaces/  workspace, members, invites, invite audit
  boards/      board CRUD, roles, permissions, saved views, gateway
  columns/     columns CRUD and ordering
  tasks/       task CRUD, moving, analytics, checklists, attachments
  notifications/ task comments, mentions, notification feed and publisher
  teams/       workspace teams and team members
  users/       profile and avatars
  storage/     local/cloudinary/imagekit adapters
  demo/        demo login and demo workspace reset
  common/      cors, locale, rate limit helpers
```

Ключевые backend-решения:

- все private REST endpoints защищены `JwtAuthGuard`;
- WebSocket gateway использует отдельный `WsJwtGuard`;
- DTO проходят global `ValidationPipe` с `whitelist` и `forbidNonWhitelisted`;
- permissions вынесены в отдельный service и покрыты тестами;
- Swagger доступен на `/api/docs`, JSON spec - на `/api/docs.json`;
- frontend-типы генерируются из OpenAPI spec.

## Маршруты приложения

| Route | Назначение |
| --- | --- |
| `/` | Landing и вход в продукт/demo |
| `/auth/login` | Авторизация |
| `/auth/register` | Регистрация |
| `/invite/[token]` | Preview и принятие workspace invite |
| `/profile` | Профиль, аватар, активные сессии |
| `/workspaces` | Глобальный каталог доступных workspace/boards |
| `/workspaces/[id]` | Workspace overview |
| `/workspaces/[id]/boards` | Доски выбранного workspace |
| `/workspaces/[id]/boards/[boardId]` | Канбан-доска |
| `/workspaces/[id]/my-tasks` | Мои задачи в workspace |
| `/workspaces/[id]/teams` | Команды workspace |
| `/workspaces/[id]/settings` | Участники, invite-ссылки и настройки |

## API

Основные группы endpoints:

- `api/auth/*` - register, login, refresh, logout, current user, avatar, sessions, ws token.
- `api/workspaces/*` - workspaces, members, active workspace, roles, deletion.
- `api/workspaces/:workspaceId/invites` - public invite links.
- `api/workspace-invites/:token` - invite preview and accept.
- `api/workspaces/:workspaceId/teams` - teams, team members, team tasks.
- `api/boards/*` - boards, access, members, sharing, saved views.
- `api/tasks/*` - tasks, moving, analytics, checklist items, attachments.
- `api/tasks/:taskId/comments` - task comments and mentions.
- `api/tasks/:taskId/checklist-items` - task checklist CRUD and ordering.
- `api/tasks/:taskId/attachments` - attachment upload, deletion and file access.
- `api/notifications/*` - notification feed, unread count and read markers.
- `api/demo/*` - demo login/reset/register flows.
- `api/storage/*` - file delivery.

Swagger UI:

```text
http://localhost:3001/api/docs
```

OpenAPI JSON:

```text
http://localhost:3001/api/docs.json
```

## Auth и безопасность

- Access token и refresh token хранятся в httpOnly cookies.
- Refresh token rotation: каждый refresh выдает новую пару токенов и отзывает старый refresh token.
- Reuse detection: повторное использование отозванного refresh token отзывает активные сессии пользователя.
- Управление сессиями доступно из профиля.
- WebSocket auth использует отдельный короткоживущий ws token.
- Backend включает CORS с credentials и env-based origin policy.
- DTO validation запрещает лишние поля.
- Для публичных invite/demo сценариев есть in-memory rate limiter.

## Cache и realtime-инвалидация

Данные доски одновременно должны быть быстрыми и актуальными:

- access checks выполняются без server cache;
- общий board content кешируется по tag;
- backend после изменений может дернуть frontend route `/api/cache/revalidate-board`;
- frontend вызывает `revalidateTag` по board id;
- клиент дополнительно получает realtime-события через Socket.IO.

Для PWA используется отдельная клиентская cache-модель:

- Service Worker не кеширует `/api/*` и `/socket.io/*`, чтобы не сохранять приватные API-ответы в Cache API;
- HTML routes и RSC payloads кешируются отдельно, потому что Next.js App Router при client navigation делает отдельные payload-запросы;
- данные API сохраняются не в Service Worker, а в IndexedDB через TanStack Query dehydration/hydration;
- persisted query cache живет ограниченное время и сбрасывается при login/logout/demo login, чтобы данные разных пользователей не смешивались;
- offline-доступ к доске считается валидным только если есть и query data доски, и сохраненный navigation route.

## Тесты и качество

В проекте есть unit tests для критичных частей:

- auth service и refresh-token сценарии;
- WebSocket JWT guard;
- board permissions;
- boards service и gateway;
- tasks service и analytics;
- workspace service и invites;
- teams service;
- avatar/storage helpers;
- frontend auth hook;
- board filters;
- socket hook;

Команды:

```bash
# frontend
cd frontend
npm run type-check
npm run lint
npm test
npm run build

# backend
cd backend
npm test
npm run build
```

## Локальный запуск

### Требования

- Node.js 20+
- PostgreSQL 15+ или Docker

### Docker Compose

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

После запуска:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001>
- Swagger: <http://localhost:3001/api/docs>

### Backend вручную

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

Основные env-переменные:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=taskflow
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:3000
FRONTEND_REVALIDATE_URL=http://localhost:3000/api/cache/revalidate-board
FRONTEND_REVALIDATE_SECRET=...
STORAGE_PROVIDER=local
ENABLE_DEMO_MODE=true
```

### Frontend вручную

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Env:

```env
API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
FRONTEND_REVALIDATE_SECRET=...
```

### PWA/offline проверки

PWA Service Worker регистрируется только в production build и secure context. Для проверки installability и offline mode:

```bash
cd frontend
npm run build
npm run start
```

Проверять лучше на `https` production/staging домене или на localhost. Открытие с телефона по `http://LAN-IP` обычно не считается secure context, поэтому установка PWA и Service Worker могут не работать.

Manual smoke checks:

- открыть приложение online и войти в demo/user account;
- открыть `/workspaces`, workspace overview и 2-3 доски, чтобы прогреть query cache и navigation cache;
- в DevTools проверить `Application -> Manifest`, `Service Workers`, `Cache Storage`, `IndexedDB`;
- отключить сеть;
- убедиться, что offline banner появился без reload;
- открыть кешированную доску и проверить, что задачи видны, а создание/редактирование отключено;
- попробовать открыть незакешированную доску или workspace-раздел и увидеть warning вместо browser offline error;
- включить сеть и проверить, что offline banner исчезает, появляется reconnect snackbar и данные обновляются.

### Comments/notifications smoke checks

- открыть одну задачу в двух окнах, добавить комментарий в одном окне и проверить появление во втором без refresh;
- упомянуть участника доски и проверить notification bell, unread count и переход к задаче по клику;
- закрыть задачу, открытую из уведомления, и убедиться, что `taskId` исчез из URL;
- удалить задачу в одном окне и проверить, что во втором карточка исчезла, а открытый task modal закрылся;
- войти viewer-пользователем и проверить, что комментарии доступны только для чтения.

## OpenAPI types

Frontend-типы API генерируются из backend Swagger spec:

```bash
cd frontend
npm run generate:types
```

Перед генерацией backend должен быть запущен на `http://localhost:3001`.

## Что еще в roadmap

Проект активно развивается. В плане отдельно вынесены:

- полноценная мобильная работа с доской;
- persistent оффлайн очередь изменений;
- workspace whiteboards;
- календарь/таймлайн/roadmap;
- расширенная командная аналитика;
- глобальный поиск и command palette;
- CI/e2e тесты качества;
- проверка безопасности.
