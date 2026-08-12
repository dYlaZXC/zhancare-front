import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the Services admin domain: create a category
 * (a service can't be created without one already existing — the category
 * picker only offers existing categories, and a fresh CI DB has none),
 * create a service under it, edit, then deactivate — against
 * src/components/services/admin/ServicesView.tsx.
 *
 * Deleting a service/category here shows a native `confirm()` dialog, not a
 * custom modal (handleDelete / handleDeleteCategory both call `confirm(...)`
 * directly) — accepted via the page's `dialog` event.
 */

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

test("create category, create/edit/deactivate a service", async ({ page }) => {
  const unique = Date.now();
  const categoryName = `Смоук Категория ${unique}`;
  const serviceName = `Смоук Услуга ${unique}`;

  page.on("dialog", (d) => d.accept());

  await page.goto("/admin/services", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Добавить услугу" })).toBeVisible({
    timeout: 15_000,
  });

  // ── Create category ──────────────────────────────────────────────────
  await page.getByTitle("Управление категориями").click();
  await page.getByPlaceholder("Например: Гастроэнтерология").fill(categoryName);
  await page.getByRole("button", { name: "Добавить категорию" }).click();
  // category modal closes itself on successful save
  await expect(page.getByRole("button", { name: "Добавить категорию" })).not.toBeVisible({
    timeout: 10_000,
  });

  // ── Create service under that category ───────────────────────────────
  await page.getByRole("button", { name: "Добавить услугу", exact: true }).click();
  // the category button shows whatever's currently selected (defaults to
  // categories[0], not a fixed placeholder) — target it by title instead of
  // its text so this doesn't depend on what other categories already exist
  await page.getByTitle("Выбрать категорию").click();
  await page.getByText(categoryName, { exact: true }).click();
  await page.getByPlaceholder("Например: Общий анализ крови").fill(serviceName);
  await page.locator('input[type="number"][placeholder="0"]').fill("5000");

  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByText(serviceName, { exact: true })).toBeVisible({ timeout: 10_000 });

  // ── Edit ─────────────────────────────────────────────────────────────
  const row = page
    .locator("div")
    .filter({ hasText: serviceName })
    .filter({ has: page.getByTitle("Редактировать") })
    .last();
  await row.getByTitle("Редактировать").click();

  const editedServiceName = `${serviceName} Ред`;
  await expect(page.getByText("Редактировать услугу", { exact: true })).toBeVisible();
  // unlike PatientManagement's edit form, this input keeps its placeholder
  // even when pre-filled, so the same locator works for create and edit
  await page.getByPlaceholder("Например: Общий анализ крови").fill(editedServiceName);
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText(editedServiceName, { exact: true })).toBeVisible({ timeout: 10_000 });

  // ── Deactivate ───────────────────────────────────────────────────────
  const editedRow = page
    .locator("div")
    .filter({ hasText: editedServiceName })
    .filter({ has: page.getByTitle("Удалить") })
    .last();
  await expect(editedRow.getByText("Активна", { exact: true }).first()).toBeVisible();
  await editedRow.getByTitle("Удалить").click(); // confirm() auto-accepted above

  await expect(editedRow.getByText("Выкл", { exact: true })).toBeVisible({ timeout: 10_000 });
});
