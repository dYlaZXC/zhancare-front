import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for booking a consultation via AddEventModal —
 * the most interdependent form in the admin panel (patient -> doctor ->
 * availability -> date -> slots -> price -> payment chain, ~12 effects).
 * Scoped to the single highest-value path: book an online consultation for
 * the seeded patient with the seeded doctor, on the "today" slot the
 * calendar defaults to.
 *
 * Precondition, done inline rather than via a fixture: the seeded doctor
 * (doctor@zhancare.test) has no DoctorSchedule at all out of the box (see
 * seed_test_data.py), so slot generation would show "no working hours" and
 * block the whole flow. Rather than modifying the seed script — which lives
 * in zhancare-back, where a push to main triggers a direct production
 * deploy with no PR gate, too risky for a test-fixture change — this test
 * sets up a same-day template schedule for the doctor itself first, reusing
 * the exact flow already proven in staff-management.spec.ts.
 */

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

const WEEKDAY_RU = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
]; // index matches JS Date.getDay(), same convention as DEFAULT_WEEKDAYS' dayIndex in StaffScheduleModal.tsx

test("book an online consultation end to end", async ({ page }) => {
  // ── Precondition: give the seeded doctor a same-day template schedule ──
  await page.goto("/admin/staff", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Добавить Сотрудника" })).toBeVisible({
    timeout: 15_000,
  });

  const doctorCard = page
    .locator("div")
    .filter({ hasText: "Дмитрий Врачёв" })
    .filter({ has: page.getByTitle("Расписание") })
    .last();
  await doctorCard.getByTitle("Расписание").click();
  await expect(page.getByRole("button", { name: "Постоянное", exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Постоянное", exact: true }).click();

  const todayLabel = WEEKDAY_RU[await page.evaluate(() => new Date().getDay())];
  const todayToggle = page.getByTitle(todayLabel);
  await expect(todayToggle).toBeVisible({ timeout: 10_000 });
  const todayRow = page.locator("div").filter({ has: todayToggle }).last();
  // idempotent on rerun: only enable if not already on (enabled = filled
  // blue background, same convention checked in staff-schedule.spec.ts)
  const alreadyOn = await todayToggle.evaluate((el) => el.className.includes("bg-blue-500"));
  if (!alreadyOn) await todayToggle.click();
  const timeInputs = todayRow.locator('input[type="time"]');
  await expect(timeInputs.first()).toBeVisible();
  // wide enough that "now" is virtually guaranteed to fall inside it,
  // regardless of what time of day this happens to run
  await timeInputs.first().fill("06:00");
  await timeInputs.last().fill("23:00");

  await page.getByRole("button", { name: "Сохранить постоянное" }).click();
  await expect(page.getByRole("button", { name: "Постоянное", exact: true })).not.toBeVisible({
    timeout: 10_000,
  });

  // ── Book: patient, doctor, slot ─────────────────────────────────────
  await page.goto("/admin/schedule", { waitUntil: "load" });
  // ScheduleView defaults to month view, which renders its own tiny
  // per-day "Добавить запись" (lowercase "запись") icon buttons — one per
  // visible day cell, ~40 of them. Accessible-name matching is
  // case-insensitive by default, so without exact:true this header button
  // ("Добавить Запись", capital "З") collides with all of them. This
  // header button resets selectedDate to null, so the modal falls back to
  // today regardless of which button opened it.
  await page.getByRole("button", { name: "Добавить Запись", exact: true }).click();

  await expect(page.getByText("Видеоконсультация", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByText("Видеоконсультация", { exact: true }).click();

  // SearchSelect's trigger is a plain onClick <div>, not a <button> — no
  // ARIA role, so it can only be targeted by its placeholder text
  await page.getByText("Выберите пациента...").click();
  await page.getByText("Иван Пациентов", { exact: true }).click();

  await page.getByText("Выберите доктора...").click();
  await page.getByText("Дмитрий Врачёв", { exact: true }).click();

  // duration auto-fills from the doctor's profile once selected, date
  // defaults to today — only time is left to pick
  await expect(page.getByText("Выберите время")).toBeVisible({ timeout: 10_000 });
  await page.getByText("Выберите время").click();
  // each slot button renders two lines ("12:30" and "– 13:00" on a second
  // span), so its full text is "12:30– 13:00" — an anchored ^...$ regex
  // never matches; match the leading HH:MM instead
  await page
    .locator('button[type="button"]:not([disabled])')
    .filter({ hasText: /^\d{2}:\d{2}/ })
    .first()
    .click();

  await page.getByRole("button", { name: "Создать Запись" }).click();
  await expect(page.getByText("Запись создана!")).toBeVisible({ timeout: 15_000 });
});
