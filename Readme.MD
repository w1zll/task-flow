# TaskFlow - full-stack таск-трекер для команд

TaskFlow - таск-трекер с workspace-моделью, канбан-досками, командами, ролями доступа, realtime-синхронизацией, JWT-auth через httpOnly cookies и современной frontend-архитектурой на Next.js App Router.

**Online версия:** <https://task-flow-silk-delta.vercel.app/>

## Что показывает проект

- Опыт с современным frontend: Next.js App Router, TypeScript, MUI, TanStack Query, Zustand, Socket.IO, i18n.
- Опыт с backend: NestJS, TypeORM, PostgreSQL, Guards, DTO validation, Swagger/OpenAPI, WebSocket gateway.
- Понимание auth/security: access/refresh JWT в httpOnly cookies, refresh-token rotation, отзыв сессий, WS-auth.
- Работа с realtime и отказоустойчивостью: optimistic UI, ack/rollback, очередь несохраненных socket-мутаций.
- Умение поддерживать большой frontend: декомпозиция компонентов, feature-based структура, типизированные API-клиенты, тесты.
- Продуктовое мышление: demo-flow, фильтры, saved views, роли, teams, приглашения, loading feedback, empty/error states, ru/en локализация.

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
- Модальное окно задачи для редактирования деталей.
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

### Realtime

- Socket.IO синхронизация состояния доски.
- JWT-аутентификация WebSocket-соединения.
- События для обновления, перемещения и переупорядочивания задач.
- Optimistic UI с ожиданием server ack.
- Rollback при ошибке или отсутствии надежного соединения.
- In-memory очередь несохраненных socket-мутаций: после восстановления связи пользователь сам выбирает, применить изменения или отказаться.

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
| Socket.IO Client | Realtime-доска |
| Axios | HTTP-клиент с cookie-based auth flow |
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
  -> WorkspaceMember
      -> Workspace
          -> Board
              -> Column
                  -> Task
          -> Team
              -> TeamMember
          -> WorkspaceInvite

Board
  -> BoardMember
  -> BoardView
```

Workspace является основной границей продукта. Доски, команды, участники, приглашения, задачи и настройки живут внутри workspace. При этом board roles отделены от workspace roles: пользователь может быть участником workspace, но иметь отдельную роль на конкретной доске.

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

### Backend-структура

```text
backend/src
  auth/        login, register, refresh rotation, sessions, ws token
  workspaces/  workspace, members, invites, invite audit
  boards/      board CRUD, roles, permissions, saved views, gateway
  columns/     columns CRUD and ordering
  tasks/       task CRUD, moving, analytics
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
- `api/tasks/*` - tasks, moving, analytics.
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
- PWA read-only offline mode;
- activity log;
- комментарии, упоминания, уведомления;
- чеклисты и вложения;
- persistent оффлайн очередь изменений;
- workspace whiteboards;
- календарь/таймлайн/roadmap;
- расширенная командная аналитика;
- глобальный поиск и command palette;
- CI/e2e тесты качества;
- проверка безопасности.
