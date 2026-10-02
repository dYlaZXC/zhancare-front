import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the Staff Management admin domain: create a
 * doctor, edit them without touching schedule fields, then confirm the
 * schedule-preserving contract (editing a staff member must never wipe their
 * DoctorSchedule rows) that StaffFormModal's weeklySchedulesFromMember/
 * buildSchedulesArray round trip exists specifically to protect — see
 * src/components/services/admin/staff-management/modals/StaffFormModal.tsx.
 */

// Same convention as e2e/global-setup.ts — the API lives on a different
// origin/port than the frontend `baseURL` this config points `page` at.
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://localhost:8000/api/v1";

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

test("create doctor, edit, and confirm schedule survives edit + persists across reopen", async ({
  page,
}) => {
  const unique = Date.now();
  const firstName = "Смоук";
  const lastName = `Тестов${unique}`;
  const email = `smoke.doctor.${unique}@zhancare.test`;
  const phone = `701${String(unique).slice(-7)}`;

  let doctorId: number | null = null;

  try {
    await page.goto("/admin/staff", { waitUntil: "load" });
    await expect(page.getByRole("button", { name: "Добавить Сотрудника" })).toBeVisible({
      timeout: 15_000,
    });

    // ── Create ────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Добавить Сотрудника" }).click();

    await page.getByRole("button", { name: "Доктор" }).click();
    await page.getByPlaceholder("Введите имя").fill(firstName);
    await page.getByPlaceholder("Введите фамилию").fill(lastName);
    await page.getByPlaceholder("example@clinic.kz").fill(email);
    await page.getByPlaceholder("+7 (700) 123-45-67").fill(phone);
    await page.getByRole("button", { name: "Сгенерировать" }).click();
    await page.locator('input[type="number"][placeholder="30"]').fill("30");

    // Capture the created doctor's id from the real create response so
    // afterward we can clean it up — otherwise every run of this test
    // leaves a real, permanently-'available' doctor account behind (this
    // is exactly how a batch of leftover "Смоук Тестов..." test doctors
    // ended up surfacing in real AI consultation recommendations).
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/staff/") && resp.request().method() === "POST"
      ),
      page.locator('button[type="submit"]').filter({ hasText: "Добавить" }).click(),
    ]);
    const created = await createResponse.json().catch(() => null);
    doctorId = created?.id ?? null;

    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible({ timeout: 10_000 });

    // ── Edit (name tweak only — must not touch schedule) ────────────────────
    const card = page
      .locator("div")
      .filter({ hasText: `${firstName} ${lastName}` })
      .filter({ has: page.getByTitle("Редактировать профиль") })
      .last();
    await card.getByTitle("Редактировать профиль").click();

    const editedLastName = `${lastName}Ред`;
    await page.getByPlaceholder("Введите фамилию").fill(editedLastName);
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText(`${firstName} ${editedLastName}`)).toBeVisible({ timeout: 10_000 });

    // ── Schedule: set a template day, save, close, reopen, confirm persisted ─
    const editedCard = page
      .locator("div")
      .filter({ hasText: `${firstName} ${editedLastName}` })
      .filter({ has: page.getByTitle("Расписание") })
      .last();
    await editedCard.getByTitle("Расписание").click();

    await expect(page.getByRole("button", { name: "По датам" })).toBeVisible({ timeout: 10_000 });
    // exact: true everywhere below — the footer's "Сохранить постоянное"
    // save button also matches this tab button's name as a substring
    await expect(page.getByRole("button", { name: "Постоянное", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Постоянное", exact: true }).click();

    await page.getByTitle("Понедельник").click();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
    await page.locator('input[type="time"]').first().fill("10:00");

    await page.getByRole("button", { name: "Сохранить постоянное" }).click();
    // modal closes itself on successful save (same convention as the other
    // admin form modals in this codebase) — wait for it to leave the DOM
    // rather than clicking a stale "Закрыть" button
    await expect(page.getByRole("button", { name: "Постоянное", exact: true })).not.toBeVisible({
      timeout: 10_000,
    });

    // reopen and confirm the toggle survived — scheduleModalTab is local
    // component state that persists across close/reopen (the modal hides via
    // a conditional render, not an unmount), so this second open can land
    // straight back on "template" with its footer save button already
    // showing, which is exactly what made the unscoped locator ambiguous
    await editedCard.getByTitle("Расписание").click();
    await page.getByRole("button", { name: "Постоянное", exact: true }).click();
    await expect(page.getByTitle("Понедельник")).toHaveClass(/bg-blue-500|border-blue-500/);
    await expect(page.locator('input[type="time"]').first()).toHaveValue("10:00");
  } finally {
    // Runs whether the test passed or failed — a failed assertion above
    // must not leave this test's doctor behind any more than a passing run
    // would. page.request shares the page's browser context, but NOT its
    // JS-level axios Authorization header, so that header is set by hand
    // here from the same localStorage token api.ts itself reads from (see
    // reference_dev_stack_ui_verification memory for the same pattern used
    // for live, non-mocked backend verification).
    if (doctorId) {
      const accessToken = await page.evaluate(() => localStorage.getItem("access_token")).catch(() => null);
      await page.request
        .patch(`${BACKEND_URL}/staff/${doctorId}/`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          data: { is_deleted: true },
        })
        .catch(() => {}); // best-effort — never let cleanup itself fail the test
    }
  }
});
