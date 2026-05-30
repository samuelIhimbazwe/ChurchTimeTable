import { expect, test } from "@playwright/test";

async function loginAsLeader(page: import("@playwright/test").Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { name: "Attendance trend" }),
  ).toBeVisible({ timeout: 30_000 });
}

test("event engine route renders with calendar controls", async ({ page }) => {
  await loginAsLeader(page);
  await page.goto("/en/dashboard/events");
  await expect(page).toHaveURL(/\/en\/dashboard\/events$/, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "Event engine" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: "Event engine" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Create event" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Month" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Week" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agenda" })).toBeVisible();
});

test("leaders can create a scheduled event from the event engine", async ({ page }) => {
  await loginAsLeader(page);
  await page.goto("/en/dashboard/events");

  await page.getByRole("button", { name: "Create event" }).click();

  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  const stamp = `PW-${Date.now()}`;
  await page.getByLabel("Title").fill(`Playwright Event ${stamp}`);
  await page.getByLabel("Type").selectOption("REHEARSAL");
  await page.getByLabel("Ministry scope").selectOption("CHOIR");
  await page.getByLabel("Status").selectOption("SCHEDULED");
  await page.getByLabel("Start time").fill(toDateTimeLocal(start));
  await page.getByLabel("End time").fill(toDateTimeLocal(end));
  await page.getByLabel("Location").fill(`Hall ${stamp}`);
  await page.getByLabel("Recurrence").selectOption("WEEKLY");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: "Agenda" }).click();
  await expect(page.getByText(`Playwright Event ${stamp}`)).toBeVisible({
    timeout: 30_000,
  });

  const editedTitle = `Playwright Event ${stamp} edited`;
  await page
    .getByRole("row", { name: new RegExp(`Playwright Event ${stamp}`) })
    .getByRole("button", { name: "Edit" })
    .click();
  await page.getByLabel("Title").fill(editedTitle);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(editedTitle)).toBeVisible({ timeout: 30_000 });
});

function toDateTimeLocal(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
