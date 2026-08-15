import { test, expect } from "@playwright/test";
import path from "path";

/**
 * Critical smoke coverage for the referring-doctor / performing-doctor
 * split on diagnostics bookings — two independent business roles that must
 * never be conflated in the UI (see PatientManagement-adjacent backend
 * model: DiagnosticsAppointment.doctor is who referred the patient and
 * drives commission; performing_doctor is who actually carries out the
 * test, snapshotted from DiagnosticsService.doctor at booking time).
 *
 * Uses two distinct doctors — a freshly created one assigned as the
 * service's performing doctor, and the seeded doctor as the referring one
 * — specifically so the test can't pass by coincidence if the two roles
 * ever got wired to the same field again.
 */

const MONTHS_SHORT_RU = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

test.use({ storageState: path.join(__dirname, ".auth/clinic-admin.json") });

test("diagnostics booking keeps referring and performing doctor distinct end to end", async ({
  page,
}) => {
  // This test chains more real mutations (staff, category, service, schedule
  // template, booking) than any sibling spec's single test — the default
  // 30s global timeout is tuned for lighter flows and cuts this one off
  // mid-assertion even on a clean pass.
  test.setTimeout(60_000);

  const unique = Date.now();
  const performerFirstName = "Смоук";
  const performerLastName = `Исполнитель${unique}`;
  // Kept short deliberately: DiagnosticsAppointment.category is a
  // CharField(max_length=20) populated from the category's transliterated
  // slug at booking time (see diagnostics/views.py appointment create()),
  // so a longer name here would 500 on booking — a real pre-existing bug,
  // unrelated to performing_doctor, flagged separately rather than worked
  // around by widening scope here.
  const categoryName = `Смоук ${unique}`;
  const serviceName = `Смоук Диагностика ${unique}`;
  // DiagnosticsServiceSerializer.get_doctor_name (and the ServiceFormModal
  // doctor picker) render "last_name first_name" — different order from
  // StaffFormModal's own card, which is why this is captured separately
  // rather than reusing "${performerFirstName} ${performerLastName}".
  const performerServiceDisplayName = `${performerLastName} ${performerFirstName}`;

  page.on("dialog", (d) => d.accept());

  // Booking date: tomorrow, computed in the CLINIC's own timezone
  // (Asia/Almaty), not the runner's. Two independent reasons to avoid
  // "today": (1) the backend's slot generator filters out anything before
  // clinic-local now() — if the runner's own calendar date is already a
  // full clinic-local day behind/ahead near midnight, "today" can read as
  // fully elapsed; (2) even with perfectly aligned timezones, "today" can
  // legitimately have zero slots left if the runner happens to execute
  // after the service's own working hours (06:00–23:00) already closed for
  // the day. Tomorrow comfortably avoids both.
  const targetDate = await page.evaluate(() => {
    const almatyToday = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Almaty" }).format(new Date());
    const [y, m, d] = almatyToday.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [, targetMonth, targetDay] = targetDate.split("-").map(Number);
  const targetRowLabel = `${targetDay} ${MONTHS_SHORT_RU[targetMonth - 1]}.`;

  // ── Create the performing doctor ────────────────────────────────────
  await page.goto("/admin/staff", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Добавить Сотрудника" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Добавить Сотрудника" }).click();
  await page.getByRole("button", { name: "Доктор" }).click();
  await page.getByPlaceholder("Введите имя").fill(performerFirstName);
  await page.getByPlaceholder("Введите фамилию").fill(performerLastName);
  await page.getByPlaceholder("example@clinic.kz").fill(`smoke.performer.${unique}@zhancare.test`);
  await page.getByPlaceholder("+7 (700) 123-45-67").fill(`703${String(unique).slice(-7)}`);
  await page.getByRole("button", { name: "Сгенерировать" }).click();
  await page.locator('input[type="number"][placeholder="30"]').fill("30");
  await page.locator('button[type="submit"]').filter({ hasText: "Добавить" }).click();
  await expect(
    page.getByText(`${performerFirstName} ${performerLastName}`)
  ).toBeVisible({ timeout: 10_000 });

  // ── Create a category + service, assigning that doctor as performer ──
  await page.goto("/admin/services", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Добавить услугу" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTitle("Управление категориями").click();
  await page.getByPlaceholder("Например: Гастроэнтерология").fill(categoryName);
  await page.getByRole("button", { name: "Добавить категорию" }).click();
  await expect(page.getByRole("button", { name: "Добавить категорию" })).not.toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "Добавить услугу", exact: true }).click();
  await page.getByTitle("Выбрать категорию").click();
  // The freshly created category becomes the form's default selection, so
  // its name renders twice: once in the (already-selected) trigger button
  // and once as the dropdown option itself. The dropdown is portaled to
  // document.body, so it's always the later match in DOM order — .last()
  // reliably targets the option, not the trigger.
  await page.getByText(categoryName, { exact: true }).last().click();
  await page.getByPlaceholder("Например: Общий анализ крови").fill(serviceName);
  await page.locator('input[type="number"][placeholder="0"]').fill("5000");

  // Doctor picker — "Не назначен" is this button's unique unselected-state
  // text within the service form (the category picker's placeholder is
  // different text, so no collision there)
  await page.getByText("Не назначен").click();
  await page.getByRole("button", { name: `${performerLastName} ${performerFirstName}` }).click();
  // confirm the dropdown actually closed and the trigger shows the pick —
  // otherwise a still-open dropdown can sit on top of the submit button
  // below and hang the next click waiting for it to become unobscured
  await expect(page.getByText("Не назначен")).not.toBeVisible({ timeout: 5_000 });

  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByText(serviceName, { exact: true })).toBeVisible({ timeout: 10_000 });

  // ── Give the service an exact-date availability override for targetDate ──
  // Uses the "По датам" tab (this modal's default tab) instead of the
  // "Постоянное" weekday-recurring one: an exact date sidesteps any
  // weekday/timezone translation entirely — no guessing which day-of-week
  // button corresponds to targetDate under whatever timezone is in play.
  const serviceRow = page
    .locator("div")
    .filter({ hasText: serviceName })
    .filter({ has: page.getByTitle("Расписание") })
    .last();
  await serviceRow.getByTitle("Расписание").click();
  await expect(page.getByText("По датам", { exact: true })).toBeVisible({ timeout: 10_000 });

  // Rows are direct children of this specific container — scoping here
  // (rather than an unscoped page-wide `div` filter) avoids matching every
  // ancestor div that also happens to contain the target row's text.
  const dayRows = page.locator("div.px-5.pb-5.space-y-2 > div");
  const targetRow = dayRows.filter({ hasText: targetRowLabel });
  const loadingSpinner = page.locator("div.flex.items-center.justify-center.py-12");
  // This exact class combo (px-6 py-4 flex items-center gap-3) is unique to
  // the week-navigator bar in this modal — its last button is "next week".
  const nextWeekButton = page.locator("div.px-6.py-4.flex.items-center.gap-3 button").last();

  // Wait for the initial week's rows to actually load before checking
  // whether targetDate is among them — otherwise the check below can race
  // the fetch and see zero rows, triggering an unnecessary (and wrong)
  // week-forward click even when targetDate was in the first week all along.
  await loadingSpinner.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
  await expect(dayRows.first()).toBeVisible({ timeout: 10_000 });
  // The modal always opens on the current week; targetDate only falls
  // outside it if today is Sunday (tomorrow = next Monday). Bounded retry
  // instead of a single click, since this is a bit fuzzy across the current
  // week widget's own (browser-local) notion of "today".
  for (let i = 0; i < 2 && !(await targetRow.isVisible().catch(() => false)); i++) {
    await nextWeekButton.click();
    await loadingSpinner.waitFor({ state: "visible", timeout: 2_000 }).catch(() => {});
    await loadingSpinner.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
  }
  await expect(targetRow).toBeVisible({ timeout: 10_000 });

  const isDayOff = await targetRow.getByText("выходной", { exact: false }).isVisible().catch(() => false);
  if (isDayOff) await targetRow.getByTitle("Отметить как рабочий").click();
  const timeInputs = targetRow.locator('input[type="time"]');
  await expect(timeInputs.first()).toBeVisible();
  await timeInputs.first().fill("06:00");
  await timeInputs.last().fill("23:00");
  await targetRow.getByTitle("Сохранить день").click();
  await expect(targetRow.getByText("Сохранено")).toBeVisible({ timeout: 10_000 });
  // Unlike the template tab (which auto-closes via onSaved), per-date saves
  // leave the modal open — close it explicitly.
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(page.getByText("По датам", { exact: true })).not.toBeVisible({ timeout: 10_000 });

  // ── Book: diagnostics, this service, both doctors ───────────────────
  await page.goto("/admin/schedule", { waitUntil: "load" });
  await page.getByRole("button", { name: "Добавить Запись", exact: true }).click();

  // Scoped to the role: "Диагностика" alone also matches an unrelated
  // breadcrumb/filter label elsewhere on the page at desktop viewport width.
  const diagnosticsTypeButton = page.getByRole("button", { name: "Диагностика Анализы и обследование" });
  await expect(diagnosticsTypeButton).toBeVisible({ timeout: 10_000 });
  await diagnosticsTypeButton.click();

  await page.getByText("Выберите пациента...").click();
  await page.getByText("Иван Пациентов", { exact: true }).click();

  await page.getByText("Найти услугу...").click();
  await page.getByText(serviceName, { exact: true }).click();

  // Исполнитель услуги is read-only, fixed by the service — the
  // performer's name is unique enough (timestamp suffix) that just
  // asserting it's on screen at this point is unambiguous
  await expect(page.getByText("Исполнитель услуги:")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(performerServiceDisplayName)).toBeVisible();

  await page.getByText("Без врача — выручка полностью клинике").click();
  await page.getByText("Дмитрий Врачёв", { exact: true }).click();

  // Override the modal's default date to targetDate — it otherwise
  // defaults to clinic-local "today", but the service's availability was
  // only configured for tomorrow above.
  await page.locator('input[type="date"]').fill(targetDate);

  // diagnostics slots render as a flat button list (unlike online/offline
  // consultations, which use a click-to-open dropdown) — no trigger to
  // click first
  const timeSlot = page
    .locator('button[type="button"]:not([disabled])')
    .filter({ hasText: /^\d{2}:\d{2}/ });
  await expect(timeSlot.first()).toBeVisible({ timeout: 10_000 });
  await timeSlot.first().click();

  await page.getByRole("button", { name: "Создать Запись" }).click();

  // ── Success screen: both roles visible and distinct ─────────────────
  await expect(page.getByText("Запись создана!")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Исполнитель", { exact: true })).toBeVisible();
  await expect(page.getByText(performerServiceDisplayName)).toBeVisible();
  await expect(page.getByText("Назначил", { exact: true })).toBeVisible();
  await expect(page.getByText("Дмитрий Врачёв")).toBeVisible();
});
