# E2E tests (Playwright)

**Перед первым запуском** установите браузер Chromium (один раз после клонирования или обновления Playwright):

```bash
npm run test:e2e:install
```

или `npx playwright install chromium`. Если видите ошибку «Executable doesn't exist», выполните эту команду на своей машине.

Запуск: `npm run test:e2e`. При необходимости сначала запустите приложение в другом терминале: `npm run dev`.

- **Тест успешного входа** (`auth.spec.ts`) требует выполненный seed: `npm run db:seed` (user@example.com / user123).
- Если dev-сервер не поднимается автоматически, задайте URL уже запущенного приложения: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`.

Интерактивный режим: `npm run test:e2e:ui`.
