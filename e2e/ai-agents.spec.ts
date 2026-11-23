import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the AI Agents admin domain (clinic-admin config
 * form + super-admin list/drilldown). Ported from the manual Playwright smoke
 * run done during the AIAgentsView structural refactor — see
 * src/components/services/admin/ai-agents/.
 */

test.describe("AI Agents — clinic admin", () => {
  test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

  test("form renders all sections, edits, and saves", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // `load` rather than `networkidle`: the admin panel keeps a websocket
    // connection open, so networkidle never resolves.
    await page.goto("/admin/ai-agents", { waitUntil: "load" });

    for (const section of [
      "Идентификация",
      "Персонаж",
      "Инструкции AI",
      "Быстрые ссылки",
      "Внешний вид",
    ]) {
      await expect(page.getByText(section, { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    }

    const nameInput = page.locator('input[placeholder="AI Ассистент"]');
    await nameInput.fill("Смоук Ассистент");
    // slug is required server-side — fill it so save doesn't 400
    await page.locator('input[placeholder="my-clinic"]').fill("smoke-test-agent");
    await expect(page.getByText("Смоук Ассистент")).toBeVisible();

    // preset color swatch
    await page.locator("button.w-7.h-7.rounded-lg.transition-all").nth(1).click();

    // quick link — "Добавить" appends to the end of the list, so target the
    // last row (a rerun against a non-fresh DB may already have earlier rows)
    await page.getByRole("button", { name: "Добавить" }).first().click();
    const newLinkTitle = page.getByPlaceholder("Например: О специалистах").last();
    await newLinkTitle.fill("О враче");
    await page
      .getByPlaceholder("Расскажи о врачах и специалистах клиники")
      .last()
      .fill("Расскажи о докторе Иванове");
    await expect(newLinkTitle).toHaveValue("О враче");

    await page.getByRole("button", { name: /Сохранить|Создать/ }).first().click();
    await expect(page.getByText("Сохранено")).toBeVisible({ timeout: 5000 });

    const relevantErrors = consoleErrors.filter(
      (e) => !e.includes("401") && !e.includes("429")
    );
    expect(relevantErrors).toEqual([]);
  });
});

test.describe("AI Agents — super admin", () => {
  test.use({ storageState: path.join(__dirname, ".auth/super-admin.json") });

  test("list renders, drills into a clinic, and navigates back", async ({ page }) => {
    await page.goto("/admin/ai-agents", { waitUntil: "load" });

    await expect(page.getByRole("heading", { name: "AI Агенты" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Всего клиник")).toBeVisible();

    await page.getByRole("button", { name: /Настроить|Создать/ }).first().click();
    await expect(page.locator("button svg.lucide-chevron-left")).toBeVisible();
    await expect(page.getByText("Идентификация", { exact: true })).toBeVisible();

    await page.locator("button.w-9.h-9.rounded-xl").first().click();
    await expect(page.getByText("Всего клиник")).toBeVisible();
  });
});
