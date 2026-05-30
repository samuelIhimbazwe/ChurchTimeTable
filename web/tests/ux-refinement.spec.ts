import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string, password = PILOT_PASSWORD) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
}

test("attendance page shows marking flow tabs", async ({ page }) => {
  await signIn(page, "choir.president@church.local");
  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/attendance$/, { timeout: 60_000 });
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Attendance governance" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("main").getByRole("tab", { name: "Mark attendance" }).click();
  await expect(page.getByRole("main").getByRole("tab", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("tab", { name: "Excused" })).toBeVisible();
});

test("events page shows create event and calendar tabs", async ({ page }) => {
  await signIn(page, "choir.president@church.local");
  await page.goto("/en/dashboard/events");
  await expect(page).toHaveURL(/\/en\/dashboard\/events$/, { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Create event" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("tab", { name: "Month" })).toBeVisible();
});

test("governance admin uses ministry tabs", async ({ page }) => {
  await signIn(page, "admin@church.local", "Admin@123");
  await page.goto("/en/dashboard/governance");
  await expect(page).toHaveURL(/\/en\/dashboard\/governance$/, { timeout: 60_000 });
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Committee governance" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("main").getByRole("tab", { name: "Protocol ministry" })).toBeVisible();
});

test("operational center loads for protocol president", async ({ page }) => {
  await signIn(page, "protocol.president@church.local");
  await page.goto("/en/dashboard/operational");
  await expect(page).toHaveURL(/\/en\/dashboard\/operational$/, { timeout: 60_000 });
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Operational center" })).toBeVisible({
    timeout: 30_000,
  });
});
