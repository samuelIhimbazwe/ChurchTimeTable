import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("protocol president can open operational center", async ({ page }) => {
  await signIn(page, "protocol.president@church.local");
  await page.goto("/en/dashboard/operational");
  await expect(page).toHaveURL(/\/en\/dashboard\/operational$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Operational center" }),
  ).toBeVisible({ timeout: 30_000 });
});

test("protocol president sees executive oversight tab", async ({ page }) => {
  await signIn(page, "protocol.president@church.local");
  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/attendance$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Attendance governance" }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Ministry oversight" }).click();
  await expect(
    page.getByRole("heading", { name: "President dashboard" }),
  ).toBeVisible({ timeout: 15_000 });
});

test("protocol coordinator sees coordinator oversight tab", async ({ page }) => {
  await signIn(page, "protocol.coordinator@church.local");
  await page.goto("/en/dashboard/attendance");
  await page.getByRole("button", { name: "Coordinator oversight" }).click();
  await expect(
    page.getByRole("heading", { name: "Coordinator dashboard" }),
  ).toBeVisible({ timeout: 15_000 });
});

test("protocol team head can open attendance without report export", async ({
  page,
}) => {
  await signIn(page, "protocol.teamhead@church.local");
  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/attendance$/, { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Mark attendance" })).toBeVisible();
});
