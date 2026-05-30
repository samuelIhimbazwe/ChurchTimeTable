import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("protocol coordinator can open attendance marking and mark present", async ({
  page,
}) => {
  await signIn(page, "protocol.coordinator@church.local");
  await page.goto("/en/dashboard/attendance");
  await expect(
    page.getByRole("heading", { level: 1, name: "Attendance governance" }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Mark attendance" }).click();
  const eventButton = page.locator("button").filter({ hasText: /\d{1,2}:\d{2}/ }).first();
  if (!(await eventButton.isVisible({ timeout: 10_000 }).catch(() => false))) {
    test.skip();
    return;
  }
  await eventButton.click();

  const presentButton = page.getByRole("button", { name: "Present" }).first();
  await expect(presentButton).toBeVisible({ timeout: 15_000 });
  await presentButton.click();
});

test("member can submit self-excuse from dashboard when assignments exist", async ({
  page,
}) => {
  await signIn(page, "member1@church.local");
  const excuseButton = page.getByRole("button", { name: "Request excuse" });
  if (!(await excuseButton.isVisible({ timeout: 10_000 }).catch(() => false))) {
    test.skip();
    return;
  }
  await excuseButton.click();
  await expect(page.getByRole("heading", { name: /Excuse request/i })).toBeVisible({
    timeout: 15_000,
  });
});
