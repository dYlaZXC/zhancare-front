import { test, expect } from "@playwright/test";
import { forceRussianLocale } from "./helpers";

/**
 * InstallAppSection.tsx's platform/installed-state branching
 * (src/sections/InstallAppSection.tsx). Every context here pins the UI to
 * "ru" via forceRussianLocale() — Playwright's default "en-US" navigator
 * language would otherwise make LanguageContext render the English copy
 * (see helpers.ts), and assertions below use the ru.json strings.
 */
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";

test.describe("Install instructions — platform detection", () => {
  test("iOS UA shows the Safari/Share-sheet steps, no install button", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: IOS_UA });
    await forceRussianLocale(context);
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.getByText("Установите приложение")).toBeVisible();
    await expect(page.getByRole("button", { name: "iPhone" })).toHaveCSS(
      "background-color",
      "rgb(55, 114, 255)"
    );
    await expect(page.getByText("Поделиться» (квадрат со стрелкой вверх)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Установить сейчас" })).toHaveCount(0);

    await context.close();
  });

  test("Android UA defaults to the Android tab with Chrome menu steps", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: ANDROID_UA });
    await forceRussianLocale(context);
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Android" })).toHaveCSS(
      "background-color",
      "rgb(55, 114, 255)"
    );
    await expect(page.getByText("значок ⋮ (три точки)")).toBeVisible();

    await context.close();
  });

  test("a synthetic beforeinstallprompt reveals the real install button and calls prompt() on click", async ({
    browser,
  }) => {
    const context = await browser.newContext({ userAgent: ANDROID_UA });
    await forceRussianLocale(context);
    const page = await context.newPage();
    await page.goto("/");

    // InstallAppSection only starts listening for beforeinstallprompt once
    // its useEffect runs on mount. The Android tab button is part of the
    // same initial render, so it being visible doesn't by itself guarantee
    // the effect has committed yet (effects run asynchronously relative to
    // paint in React 18) — a short settle after it avoids dispatching the
    // synthetic event before the listener is attached (confirmed by hand:
    // without it, dispatchEvent()'s defaultPrevented comes back false).
    await expect(page.getByRole("button", { name: "Android" })).toBeVisible();
    await page.waitForTimeout(500);

    // Mirrors what Chrome/Edge fire instead of showing their own install UI:
    // handlePrompt() in InstallAppSection.tsx calls preventDefault() and
    // stores the event, which is what should reveal the real button.
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
        prompt?: () => Promise<void>;
        userChoice?: Promise<{ outcome: string }>;
      };
      event.prompt = () => {
        (window as unknown as { __promptCalled: boolean }).__promptCalled = true;
        return Promise.resolve();
      };
      event.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(event);
    });

    const installButton = page.getByRole("button", { name: "Установить сейчас" });
    await expect(installButton).toBeVisible();
    await installButton.click();

    const promptCalled = await page.evaluate(
      () => (window as unknown as { __promptCalled?: boolean }).__promptCalled === true
    );
    expect(promptCalled).toBe(true);

    await context.close();
  });

  test("already-installed (standalone display-mode) shows the installed message instead", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await forceRussianLocale(context);
    const page = await context.newPage();
    await page.addInitScript(() => {
      const originalMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query: string) => {
        if (query.includes("display-mode: standalone")) {
          return { matches: true, media: query } as MediaQueryList;
        }
        return originalMatchMedia(query);
      };
    });
    await page.goto("/");

    await expect(page.getByText("Приложение уже установлено на этом устройстве")).toBeVisible();
    await expect(page.getByRole("button", { name: "Android" })).toHaveCount(0);

    await context.close();
  });
});
