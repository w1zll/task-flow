# TaskFlow — Канбан-доска

Полноценное full-stack приложение для управления задачами.

---

## Запуск проекта

### Требования

- Node.js 20+
- PostgreSQL 15+ (или Docker)

### Локальный запуск

#### Бэкенд

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
# Open API: http://localhost:3001/api/docs.json
```

#### Фронтенд

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Приложение: http://localhost:3000
```

### Docker запуск

```bash
# Из корня проекта
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Приложение на http://localhost:3000
Swagger на http://localhost:3001/api/docs

---

## Стек технологий

### Фронтенд

| Инструмент               | Назначение                                        |
| ------------------------ | ------------------------------------------------- |
| **Next.js** (App Router) | SSR, SSG, ISR роутинг                             |
| **TypeScript**           | Строгая типизация всего кода                      |
| **Zustand**              | Локальный UI-стейт (drag & drop, модалки, тема)   |
| **TanStack Query v5**    | Серверный стейт, кэширование, мутации             |
| **Material UI v5**       | Компоненты с кастомной темой                      |
| **@hello-pangea/dnd**    | Drag & drop для колонок и задач                   |
| **Socket.io-client**     | WebSocket клиент для real-time обновлений         |
| **Axios**                | HTTP-клиент с авто-рефреш интерцептором           |
| **next-intl**            | Интернационализация (en/ru)                       |
| **notistack**            | Уведомления и всплывающие сообщения               |
| **Storybook**            | Разработка компонентов в изоляции                |
| **Vitest**               | Быстрое тестирование компонентов                  |

### Бэкенд

| Инструмент     | Назначение                                    |
| -------------- | --------------------------------------------- |
| **NestJS**     | Модульный Node.js фреймворк                   |
| **TypeORM**    | ORM для PostgreSQL с миграциями                |
| **PostgreSQL** | Основная база данных                          |
| **JWT**        | Аутентификация через Access + Refresh токены   |
| **Passport.js**| Стратегии аутентификации (JWT, Local)          |
| **Socket.io**  | WebSocket для real-time синхронизации          |
| **bcrypt**     | Хеширование паролей и токенов                  |
| **Swagger**    | Автогенерация и документация API               |
| **Jest**       | Unit тестирование                              |

---

### Стратегии рендеринга

| Страница             | Стратегия                  | Причина                                              |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| `/`                  | **SSG** (`force-static`)   | Маркетинговая страница без динамических данных       |
| `/boards`            | **SSR**                    | Защищена авторизацией, персональный список           |
| `/boards/[id]`       | **ISR** (`revalidate: 60`) | Данные доски кэшируются на 60 сек, пересборка в фоне |
| Страницы авторизации | **Client**                 | SEO не нужен                                         |

### Управление состоянием

| Стейт                            | Инструмент            | Причина                                        |
| -------------------------------- | --------------------- | ---------------------------------------------- |
| Серверные данные (доски, задачи) | **TanStack Query**    | Кэширование, фоновый refetch, мутации          |
| Текущий пользователь             | **Zustand AuthStore**    | Нужен везде глобально, реагирует на вход/выход |
| UI-стейт (drag, модалки)         | **Zustand BoardUIStore** | Эфемерный, не требует синхронизации с сервером |
| Тема                             | **Zustand ThemeStore**   | Персистится в localStorage, реактивная         |

---

## WebSocket события

Все события требуют JWT аутентификацию через httpOnly cookies.

### `board:join` — Подписаться на доску

```javascript
socket.emit('board:join', { boardId: 'xxx' });
```

Подписывает клиента на обновления доски, отправляет текущее состояние.

### `task:update` — Обновить задачу (real-time)

```javascript
socket.emit('task:update', {
  boardId: 'xxx',
  taskId: 'yyy',
  changes: { title: 'New title', priority: 'high' }
});
```

Обновляет данные задачи. Трансляция всем клиентам доски.

### `task:move` — Переместить задачу

```javascript
socket.emit('task:move', {
  boardId: 'xxx',
  taskId: 'yyy',
  columnId: 'zzz',
  order: 2
});
```

Перемещает задачу в другую колонку с автоматическим переупорядочиванием.

---

## 🌍 Интернационализация (i18n)

### Поддерживаемые языки

- **English** (`en`)
- **Russian** (`ru`) — по умолчанию

### Использование

```jsx
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations();
  return <h1>{t('home.title')}</h1>;
}
```

Компонент `LocaleSwitcher` позволяет переключать язык. Локаль определяется из cookies → Accept-Language → default (ru).

---

## 🔐 Аутентификация

### JWT токены

- **Access token** — 15 минут
- **Refresh token** — 7 дней
- Оба в **httpOnly cookies** (защита от XSS)

### Ротация

При истечении Access токена:

1. Клиент отправляет Refresh токен
2. Сервер выдаёт новую пару
3. Старый Refresh токен отзывается

### Детекция повторного использования

Если отозванный Refresh токен используется снова — все сессии пользователя отзываются.

---

## Особенности проекта

1. **httpOnly cookies** — токены недоступны через `document.cookie`, защита от XSS
2. **Ротация refresh-токенов** — каждый рефреш выдаёт новую пару и отзывает старый токен
3. **Детекция повторного использования** — повторное использование отозванного токена отзывает все сессии
4. **Оптимистичные обновления** — drag & drop мгновенно обновляет кэш, откатывается при ошибке
5. **Zustand + TanStack Query** — чёткое разделение серверного стейта и UI-стейта
6. **ISR** — `/boards/[id]` отдаётся из кэша, пересобирается каждые 60 сек без downtime
7. **FSD-архитектура** — слои `app / widgets / features / shared` с однонаправленными зависимостями
8. **NestJS guards + decorators** — `@UseGuards(JwtAuthGuard)` + `@CurrentUser()`
9. **Шаринг досок** — совместный доступ к доске по email или ID пользователя
10. **Real-time синхронизация** — WebSocket события для изменения позиции и перемещения задач между колонками
11. **Мультиязычность** — поддержка English и Russian с автоматической детекцией локали через cookies и Accept-Language
17. **Swagger/OpenAPI** — интерактивная документация API на `/api/docs` с возможностью тестирования
18. **Docker Compose** — полная развёртка всех компонентов (PostgreSQL, Backend, Frontend) одной командой
23. **Генерация типов из API** — автоматическая генерация TypeScript типов из OpenAPI Swagger

---
