import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the "По датам" (date-based) tab of
 * StaffScheduleModal — complements staff-management.spec.ts, which already
 * covers the "Постоянное" (template) tab via the create-doctor flow. This
 * spec targets the seeded doctor (doctor@zhancare.test, from
 * manage.py seed_test_data) directly rather than creating a new one, since
 * it's only exercising the schedule modal itself.
 *
 * Enable a day, set its hours, save the whole week (handleSaveEntireWeek),
 * close the modal, reopen it, and confirm the change persisted.
 */

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

test("date-based schedule: enable a day, save, and confirm it persists across reopen", async ({
  page,
}) => {
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

  await expect(page.getByRole("button", { name: "По датам" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Постоянное" })).toBeVisible();
  // "По датам" is the default tab — no need to click it

  // ── Enable Monday and set its hours ─────────────────────────────────────
  const mondayToggle = page.getByRole("button", { name: "Пн", exact: true });
  // the day list loads async (fetchPlannerWeek) after the modal opens —
  // wait for it before checking day-off state below, otherwise on a colder
  // CI run the check can land before any row has rendered at all, read as
  // "not a day off" by default, and skip the click that was needed
  await expect(mondayToggle).toBeVisible({ timeout: 10_000 });
  // scope to the row via the day-toggle button, not hasText: "Понедельник"
  // — .filter({hasText}) matches every ancestor div of that text node, and
  // .last() then picks the innermost one, which is just the label's own
  // wrapper, not the row. The toggle button is always present regardless
  // of on/off state, so it's a stable anchor for the whole row either way.
  const mondayRow = page.locator("div").filter({ has: mondayToggle }).last();
  // idempotent on rerun against a non-fresh DB: only toggle on if Monday
  // is currently a day off — clicking an already-enabled day turns it off
  if (await mondayRow.getByText("Выходной").isVisible()) {
    await mondayToggle.click();
  }
  await expect(mondayRow.locator('input[type="time"]').first()).toBeVisible();
  await mondayRow.locator('input[type="time"]').first().fill("09:30");
  await mondayRow.locator('input[type="time"]').last().fill("17:30");

  // whole-week save button in the footer — every enabled day row also has
  // its own icon-only save button whose accessible name is the same
  // "Сохранить" (derived from its title attribute), so .last() picks the
  // footer's text button, which always renders after all the day rows
  await page.getByRole("button", { name: "Сохранить", exact: true }).last().click();
  await expect(page.getByText("Неделя сохранена")).toBeVisible({ timeout: 10_000 });

  // ── Close and reopen — confirm it persisted, not just local state ──────
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(page.getByRole("button", { name: "По датам" })).not.toBeVisible({
    timeout: 10_000,
  });

  await doctorCard.getByTitle("Расписание").click();
  await expect(page.getByRole("button", { name: "По датам" })).toBeVisible({ timeout: 10_000 });
  const reopenedMondayRow = page.locator("div").filter({ has: mondayToggle }).last();
  await expect(reopenedMondayRow.getByText("Выходной")).not.toBeVisible();
  await expect(reopenedMondayRow.locator('input[type="time"]').first()).toHaveValue("09:30");
  await expect(reopenedMondayRow.locator('input[type="time"]').last()).toHaveValue("17:30");
});
