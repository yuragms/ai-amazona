import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
  test("products page loads", async ({ page }) => {
    await page.goto("/products")
    await expect(page).toHaveURL(/\/products/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/Вход|Login/i).first()).toBeVisible()
    await expect(page.getByLabel(/email|Email/i)).toBeVisible()
    await expect(page.getByLabel(/пароль|password/i).or(page.getByPlaceholder(/password/i))).toBeVisible()
  })

  test("unauthenticated user visiting /dashboard is redirected to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/(login|api\/auth)/)
  })

  test("unauthenticated user visiting /admin is redirected to login", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/(login|api\/auth)/)
  })
})
