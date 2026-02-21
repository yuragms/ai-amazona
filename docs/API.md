# API documentation

Краткое описание HTTP API и серверных действий приложения.

## HTTP endpoints

### Auth (NextAuth)

- **`/api/auth/*`** — обработка NextAuth (signin, signout, callback, session и т.д.). Документация: [NextAuth.js](https://authjs.dev/).

### Password reset

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/auth/forgot-password` | Запрос сброса пароля. Body: `{ "email": "user@example.com" }`. Отправляет письмо со ссылкой на сброс. |
| POST | `/api/auth/reset-password` | Сброс пароля по токену. Body: `{ "token": "...", "password": "newpass" }`. |

### Checkout (Stripe)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/checkout/create-session` | Создание Stripe Checkout Session. Требует авторизацию. |
| POST | `/api/checkout/create-payment-intent` | Создание PaymentIntent для Stripe Elements. Требует авторизацию. |

### Webhooks

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/webhooks/stripe` | Webhook Stripe. Обязательна подпись `Stripe-Signature`. Обрабатывает `checkout.session.completed` (обновление заказа, письмо, очистка корзины). |

### Upload

| Method | Path | Описание |
|--------|------|----------|
| GET / POST | `/api/uploadthing` | Обработчик Uploadthing для загрузки файлов (изображения товаров). Требует админ-права в middleware Uploadthing. |

### Health & dev

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/health` | Health check: `200 { "status": "ok" }`. |
| GET | `/api/health?db=1` | Health check с проверкой БД: при успехе `200 { "status": "ok", "database": "connected" }`, иначе `503`. |
| GET | `/api/test-email?to=email@example.com` | Отправка тестового письма подтверждения заказа. **Только в development** (в production возвращает 404). |

---

## Server Actions

Основная логика доступна через Server Actions (вызов из клиента), а не через отдельные REST-эндпоинты.

- **Auth**: регистрация, вход — через NextAuth и формы (login, register).
- **Товары и каталог**: загрузка категорий и товаров через серверные компоненты и кэш.
- **Корзина**: `app/actions/cart.ts` — добавление, обновление, удаление, слияние гостевой корзины.
- **Заказы**: `app/actions/order.ts` — создание заказа, список заказов пользователя.
- **Адрес доставки**: `app/actions/address.ts` — CRUD адресов.
- **Избранное**: `app/actions/wishlist.ts` — добавление/удаление из избранного.
- **Отзывы**: `app/actions/review.ts` — создание отзыва к товару.
- **Профиль**: `app/actions/profile.ts` — обновление имени и т.д.
- **Админ**: `app/actions/admin-*.ts` и `app/actions/dashboard.ts`, `app/actions/reports.ts` — метрики, товары, заказы, пользователи, отчёты. Все проверяют `session.user.role === "ADMIN"`.

Детали параметров и возвращаемых значений см. в исходном коде перечисленных файлов.
