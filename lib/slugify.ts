/**
 * Converts text to a URL-safe slug: lowercase, spaces to hyphens, strip non-alphanumeric except hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}
