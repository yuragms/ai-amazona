import { test, expect } from "@playwright/test"

/**
 * Login flow tests require seeded DB with user@example.com / user123.
 * Run: npm run db:seed (or db:migrate + db:seed) before E2E if using a real DB.
 */
test.describe("Auth", () => {
  test("login page has email and password inputs", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("textbox", { name: /email/i }).fill("wrong@example.com")
    await page.locator('input[name="password"]').fill("wrongpass")
    await page.getByRole("button", { name: "Войти", exact: true }).click()
    await expect(page.getByText(/неверный|invalid|incorrect/i)).toBeVisible({ timeout: 5000 })
  })

  test("successful login redirects and shows Dashboard link", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("textbox", { name: /email/i }).fill("user@example.com")
    await page.locator('input[name="password"]').fill("user123")
    await page.getByRole("button", { name: "Войти", exact: true }).click()
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({ timeout: 15000 })
  })
})
