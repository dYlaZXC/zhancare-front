import { test, expect } from "@playwright/test";

/**
 * Manifest sanity: installable PWA requires a valid manifest linked from the
 * page, with a standalone display mode and icons that actually resolve.
 */
test.describe("PWA manifest", () => {
  test("is linked from the homepage <head>", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBe("/manifest.webmanifest");
  });

  test("has the fields an installable PWA needs", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);

    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("every declared icon actually resolves", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    const manifest = await res.json();

    for (const icon of manifest.icons as Array<{ src: string }>) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.ok(), `icon ${icon.src} should be reachable`).toBeTruthy();
      expect(iconRes.headers()["content-type"]).toContain("image");
    }
  });
});
