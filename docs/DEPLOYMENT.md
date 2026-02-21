# Production deployment

## 1. Environment setup

1. Скопируйте `.env.example` в `.env.local` (или задайте переменные в панели хостинга).
2. Заполните обязательные переменные:
   - **DATABASE_URL** — строка подключения PostgreSQL (production).
   - **AUTH_SECRET** — секрет для NextAuth (`npx auth secret`).
   - **STRIPE_*** — ключи и webhook secret для приёма платежей.
   - **RESEND_API_KEY** — для писем (подтверждение заказа, сброс пароля).
   - **UPLOADTHING_TOKEN** — для загрузки изображений товаров.
3. В production задайте **NEXT_PUBLIC_APP_URL** на полный URL приложения (например, `https://your-app.vercel.app`).
4. Перед первым запуском примените миграции: `npm run db:migrate`. Опционально: `npm run db:seed` для начальных данных.

Список переменных и подсказки см. в `.env.example` и README.

## 2. CI/CD pipeline

В репозитории настроен GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Триггер**: push и pull_request в ветки `main` / `master`.
- **Шаги**: `npm ci` → `npm run lint` → `npm run test` (unit + integration) → `npm run build`.
- Для сборки в CI задаются только `DATABASE_URL` и `AUTH_SECRET` (тестовые значения); деплой использует реальные переменные из настроек проекта (Vercel, Railway и т.д.).

Рекомендуется включить обязательную проверку CI перед merge (branch protection).

## 3. Monitoring

- **Health check**: эндпоинт для проверки живости приложения и (опционально) БД:
  - `GET /api/health` — возвращает `200 { "status": "ok" }`.
  - `GET /api/health?db=1` — дополнительно проверяет подключение к PostgreSQL; при ошибке — `503`.
- Используйте этот URL в настройках health check балансировщика или мониторинга (Vercel, AWS, Kubernetes и т.п.).
- Логи и метрики настраиваются средствами хостинга (Vercel Analytics, логи в CloudWatch, Datadog и т.д.).

## 4. Backup strategy

- **База данных**: настраивайте регулярные бэкапы PostgreSQL средствами провайдера (Vercel Postgres, Supabase, RDS и т.д.). Рекомендуется ежедневный снапшот с хранением не менее 7–30 дней.
- **Файлы/медиа**: изображения товаров хранятся в Uploadthing; при необходимости настройте экспорт/бэкап через их API или панель.
- **Секреты**: храните в менеджере секретов или переменных окружения хостинга; не коммитьте их в репозиторий. Имея бэкап БД и конфигурации окружения, можно восстановить приложение на новом инстансе.

## Деплой на Vercel

1. Подключите репозиторий к Vercel.
2. В настройках проекта задайте переменные окружения из `.env.example`.
3. Build command: `npm run build`. Output: стандартный для Next.js.
4. Установите **DATABASE_URL** на production PostgreSQL (Vercel Postgres или внешний).
5. После деплоя выполните миграции один раз (например, локально с production `DATABASE_URL` или через скрипт/Job): `npm run db:migrate`.
6. В Stripe Dashboard настройте webhook на `https://your-app.vercel.app/api/webhooks/stripe` с нужными событиями (например, `checkout.session.completed`).

Аналогичные шаги применимы к другим платформам (Railway, Render, Fly.io и т.д.) с подстановкой своих переменных и команд запуска.
