import { describe, it, expect } from "vitest"
import { slugify } from "./slugify"

describe("slugify", () => {
  it("lowercases text", () => {
    expect(slugify("Hello")).toBe("hello")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world")
  })

  it("trims whitespace", () => {
    expect(slugify("  foo  ")).toBe("foo")
  })

  it("strips non-alphanumeric except hyphens", () => {
    expect(slugify("Hello, World!")).toBe("hello-world")
  })

  it("handles multiple spaces", () => {
    expect(slugify("a   b")).toBe("a-b")
  })

  it("keeps existing hyphens and digits", () => {
    expect(slugify("Product-123")).toBe("product-123")
  })

  it("returns empty string for only special chars", () => {
    expect(slugify("!!!")).toBe("")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})
