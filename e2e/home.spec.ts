import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test("loads and shows welcome message", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /Welcome to Amazona/i })).toBeVisible()
    await expect(page.getByText(/Discover great products/i)).toBeVisible()
  })

  test("has link to products in header", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Products" })).toBeVisible()
  })
})
