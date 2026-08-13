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

const WEEKDAY_RU = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
]; // index matches JS Date.getDay()

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

  // ── Give the service a same-day template schedule so a slot exists ──
  const serviceRow = page
    .locator("div")
    .filter({ hasText: serviceName })
    .filter({ has: page.getByTitle("Расписание") })
    .last();
  await serviceRow.getByTitle("Расписание").click();
  await expect(page.getByRole("button", { name: "Постоянное" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Постоянное" }).click();

  const todayLabel = WEEKDAY_RU[await page.evaluate(() => new Date().getDay())];
  const todayToggle = page.getByRole("button", { name: todayLabel === "Понедельник" ? "Пн"
    : todayLabel === "Вторник" ? "Вт" : todayLabel === "Среда" ? "Ср" : todayLabel === "Четверг" ? "Чт"
    : todayLabel === "Пятница" ? "Пт" : todayLabel === "Суббота" ? "Сб" : "Вс", exact: true });
  await expect(todayToggle).toBeVisible({ timeout: 10_000 });
  const todayRow = page.locator("div").filter({ has: todayToggle }).last();
  const alreadyOn = await todayRow.getByText("выходной").isVisible().catch(() => false);
  if (alreadyOn) await todayToggle.click();
  const timeInputs = todayRow.locator('input[type="time"]');
  await expect(timeInputs.first()).toBeVisible();
  await timeInputs.first().fill("06:00");
  await timeInputs.last().fill("23:00");
  await page.getByRole("button", { name: "Сохранить шаблон" }).click();
  await expect(page.getByRole("button", { name: "Сохранить шаблон" })).not.toBeVisible({
    timeout: 10_000,
  });

  // ── Book: diagnostics, this service, both doctors ───────────────────
  await page.goto("/admin/schedule", { waitUntil: "load" });
  await page.getByRole("button", { name: "Добавить Запись", exact: true }).click();

  await expect(page.getByText("Диагностика", { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByText("Диагностика", { exact: true }).click();

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
