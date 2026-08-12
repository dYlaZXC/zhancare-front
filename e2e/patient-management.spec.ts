import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the Patient Management admin domain: create a
 * patient, edit them, confirm the edit persisted, then deactivate — full
 * CRUD round trip against
 * src/components/services/admin/PatientManagement.tsx.
 *
 * "Delete" here is a soft delete (PATCH is_active: false, per
 * handleDeletePatient) — the patient stays in the "Все"-filtered list with
 * a "Неактивен" badge rather than disappearing, so that's what's asserted.
 */

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

test("create, edit, and delete a patient", async ({ page }) => {
  const unique = Date.now();
  const firstName = "Смоук";
  const lastName = `Пациентов${unique}`;
  const email = `smoke.patient.${unique}@zhancare.test`;
  const phone = `702${String(unique).slice(-7)}`;

  await page.goto("/admin/patients", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Добавить Пациента" })).toBeVisible({
    timeout: 15_000,
  });

  // ── Create ────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Добавить Пациента" }).click();
  await page.getByPlaceholder("Введите имя").fill(firstName);
  await page.getByPlaceholder("Введите фамилию").fill(lastName);
  await page.getByPlaceholder("example@mail.com").fill(email);
  await page.getByPlaceholder("707 123 45 67").fill(phone);
  await page.getByRole("button", { name: "Сгенерировать" }).click();

  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible({ timeout: 10_000 });

  // ── Search by phone, KZ-local format (leading 8, not +7) ────────────────
  // Regression check: the phone stored is E.164 (+7...), but people type KZ
  // numbers with a leading 8 — a raw substring match against the stored
  // value never matched that until this was fixed to normalize both sides
  // the same way the backend's phone_utils.normalize_phone does.
  const searchBox = page.getByPlaceholder("Поиск по имени, email или телефону...");
  await searchBox.fill(`8${phone}`);
  await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible({ timeout: 10_000 });
  await searchBox.fill("");

  // ── Edit ─────────────────────────────────────────────────────────────
  const card = page
    .locator("div")
    .filter({ hasText: `${firstName} ${lastName}` })
    .filter({ has: page.getByTitle("Редактировать") })
    .last();
  await card.getByTitle("Редактировать").click();

  const editedLastName = `${lastName}Ред`;
  await expect(page.getByRole("heading", { name: "Редактировать Пациента" })).toBeVisible();
  const editForm = page.locator("form");
  // no placeholders in edit mode (fields are pre-filled) — first_name is
  // input #0, last_name is #1, in the same grid order as the create form
  await editForm.locator('input[type="text"]').nth(1).fill(editedLastName);
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText(`${firstName} ${editedLastName}`)).toBeVisible({ timeout: 10_000 });

  // ── Deactivate ───────────────────────────────────────────────────────
  const editedCard = page
    .locator("div")
    .filter({ hasText: `${firstName} ${editedLastName}` })
    .filter({ has: page.getByTitle("Удалить") })
    .last();
  await expect(editedCard.getByText("Активен", { exact: true })).toBeVisible();
  await editedCard.getByTitle("Удалить").click();

  await expect(page.getByRole("heading", { name: "Удалить пациента?" })).toBeVisible();
  // scope to the confirmation dialog itself — every patient card's inline
  // delete icon also has an accessible name of "Удалить" (via title=),
  // and those cards are still in the DOM underneath this modal overlay
  const deleteDialog = page.locator(".max-w-md").filter({ hasText: "Удалить пациента?" });
  await deleteDialog.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Удалить пациента?" })).not.toBeVisible({
    timeout: 10_000,
  });

  await expect(editedCard.getByText("Неактивен", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});
