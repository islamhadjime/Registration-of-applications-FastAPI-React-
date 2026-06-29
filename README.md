# Учёт внутренних заявок

Fullstack-приложение для учёта внутренних IT-заявок: создание, фильтрация, смена статуса, авторизация пользователей и администрирование.

**Backend:** FastAPI · SQLAlchemy · SQLite · JWT · bcrypt  
**Frontend:** React 18 · TypeScript · Vite · shadcn/ui · Tailwind CSS v4 · React Router

---

## Выполненные требования

### Backend
- [x] REST API на FastAPI
- [x] Хранение данных в SQLite (`backend/requests.db`)
- [x] CRUD заявок: создание, список, смена статуса, удаление
- [x] Фильтрация по статусу и приоритету
- [x] Поиск по заголовку и описанию
- [x] Сортировка по дате создания и приоритету
- [x] Пагинация
- [x] Бизнес-правила для статуса `done`
- [x] Реальная авторизация: регистрация, вход, JWT
- [x] Модель пользователей с ролями `user` / `admin`
- [x] Хеширование паролей (bcrypt)
- [x] Удаление заявок — только для администратора
- [x] Сид демо-данных (20 заявок + тестовые пользователи)

### Frontend
- [x] React + TypeScript (Vite)
- [x] Список заявок с фильтрами, поиском, сортировкой и пагинацией
- [x] Создание заявки через модальное окно
- [x] Смена статуса в таблице
- [x] Удаление заявок (для admin)
- [x] Страницы входа и регистрации
- [x] Сохранение сессии (JWT в `localStorage`)
- [x] UI на shadcn/ui + Tailwind CSS
- [x] Skeleton-загрузка, toast-уведомления
- [x] Модальное окно с деталями заявки (клик по строке)
- [x] Адаптивная вёрстка

---

## Структура проекта

```
TESTER/
├── backend/
│   ├── app/
│   │   ├── main.py              # Точка входа FastAPI
│   │   ├── auth.py              # JWT, bcrypt, guards
│   │   ├── models.py            # User, Request
│   │   ├── schemas.py           # Pydantic-схемы
│   │   ├── database.py          # SQLite + SQLAlchemy
│   │   ├── seed.py              # Демо-данные
│   │   └── routers/
│   │       ├── auth.py          # /api/auth/*
│   │       └── requests.py      # /api/requests/*
│   ├── requirements.txt
│   └── requests.db              # Создаётся при первом запуске
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── DashboardPage.tsx   # Главная: список заявок
    │   │   ├── LoginPage.tsx
    │   │   └── RegisterPage.tsx
    │   ├── components/
    │   │   ├── layout/             # AppHeader, AuthLayout
    │   │   └── ui/                 # shadcn/ui компоненты
    │   ├── context/AuthContext.tsx
    │   ├── api.ts
    │   └── types.ts
    ├── vite.config.ts             # Proxy /api → :8000
    └── package.json
```

---

## Быстрый старт

### 1. Backend

```powershell
cd backend

# Виртуальное окружение (рекомендуется)
python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/api/health  

> Если `pip` не работает из-за прокси, используйте системный Python с уже установленными пакетами.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Приложение: http://127.0.0.1:5173  

> Vite настроен на `127.0.0.1` (не `localhost`) — так надёжнее работает на Windows.  
> Запросы `/api/*` проксируются на backend `:8000`.

### 3. Демо-данные (опционально)

Скрипт удаляет все заявки и добавляет 20 фейковых записей:

```powershell
cd backend
python -m app.seed
```

---

## Учётные записи

| Роль  | Логин         | Пароль   | Возможности                          |
|-------|---------------|----------|--------------------------------------|
| Admin | `admin`       | `admin`  | Всё + удаление заявок                |
| User  | `ivan_petrov` | `user123`| Просмотр, создание, смена статуса    |
| User  | `maria_sokol` | `user123`| Просмотр, создание, смена статуса    |
| User  | `alex_kuznet` | `user123`| Просмотр, создание, смена статуса    |

Новых пользователей можно зарегистрировать на странице `/register`.

---

## Возможности интерфейса

| Функция | Описание |
|---------|----------|
| **Список заявок** | Таблица с ID, заголовком, описанием, статусом, приоритетом, датой |
| **Фильтры** | Статус, приоритет, сортировка, порядок |
| **Поиск** | По заголовку и описанию |
| **Создание** | Кнопка «Создать заявку» → модальное окно с формой |
| **Детали** | Клик по строке → модалка с полным описанием и датами |
| **Статус** | Выпадающий список в колонке «Действия» |
| **Удаление** | Кнопка корзины (только admin, не для `done`) |
| **Авторизация** | `/login`, `/register`, кнопка «Выйти» в шапке |
| **Загрузка** | Skeleton вместо спиннера при загрузке списка |

---

## API

### Авторизация

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `POST` | `/api/auth/register` | — | Регистрация нового пользователя |
| `POST` | `/api/auth/login` | — | Вход, возвращает JWT + данные пользователя |
| `GET`  | `/api/auth/me` | JWT | Текущий пользователь |

**Пример входа:**
```json
POST /api/auth/login
{ "username": "admin", "password": "admin" }
```

**Ответ:**
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "..."
  }
}
```

### Заявки

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET`    | `/api/requests` | — | Список с фильтрами и пагинацией |
| `POST`   | `/api/requests` | — | Создание заявки |
| `PATCH`  | `/api/requests/{id}/status` | — | Изменение статуса |
| `DELETE` | `/api/requests/{id}` | Admin JWT | Удаление заявки |
| `GET`    | `/api/health` | — | Проверка работоспособности |

### Query-параметры `GET /api/requests`

| Параметр | Значения | Описание |
|----------|----------|----------|
| `status` | `new` · `in_progress` · `done` | Фильтр по статусу |
| `priority` | `low` · `normal` · `high` | Фильтр по приоритету |
| `search` | строка | Поиск по title и description |
| `sort_by` | `created_at` · `priority` | Поле сортировки |
| `sort_order` | `asc` · `desc` | Порядок |
| `page` | число ≥ 1 | Номер страницы |
| `page_size` | 1–100 | Размер страницы |

---

## Бизнес-правила

- Заявку в статусе **`done`** нельзя редактировать или удалять
- Нельзя перевести заявку **из** `done` в другой статус
- Удаление доступно **только администратору** (роль `admin`)
- При нарушении правил API возвращает HTTP-ошибку с понятным сообщением на русском

---

## Сборка для production

```powershell
# Frontend
cd frontend
npm run build
# Результат: frontend/dist/

# Backend — запуск без reload
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## shadcn/ui

UI-компоненты установлены через shadcn CLI:

```powershell
cd frontend
npx shadcn@latest init
npx shadcn@latest add button input label card badge select table alert dialog skeleton tabs sonner
```

Конфигурация: `frontend/components.json`

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| `ERR_CONNECTION_REFUSED` на `:5173` | Открывайте http://127.0.0.1:5173 (не localhost) |
| API не отвечает | Убедитесь, что backend запущен на `:8000` |
| Порт 8000 занят | Остановите старый процесс или смените порт |
| Пустой список заявок | Запустите `python -m app.seed` в папке backend |
| Нет прав на удаление | Войдите как `admin` / `admin` |
