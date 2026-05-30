import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";
const ADMIN_PASSWORD = "Admin@123";

test("admin can approve a newly registered member", async ({ page }) => {
  const stamp = Date.now();
  const email = `pw.member.${stamp}@church.local`;

  await page.goto("/en/register");
  await page.getByLabel("First name").fill("Playwright");
  await page.getByLabel("Last name").fill("Member");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Password", { exact: true }).fill(PILOT_PASSWORD);
  await page.getByLabel("Confirm password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Submit registration" }).click();

  await expect(page).toHaveURL(/\/en\/pending-approval/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { name: "Your request is being reviewed" }),
  ).toBeVisible();

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });

  await page.goto("/en/dashboard/members/pending");
  await expect(page.getByRole("heading", { name: "Pending registrations" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Search members").fill(email);
  const row = page.getByRole("row", { name: new RegExp(email) });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Approve" }).click();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/en\/login/, { timeout: 30_000 });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
});

test("admin can assign a committee role on governance page", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });

  await page.goto("/en/dashboard/governance");
  await expect(
    page.getByRole("heading", { level: 1, name: "Committee governance" }),
  ).toBeVisible({ timeout: 30_000 });

  const memberSelect = page.getByLabel("Member");
  const roleSelect = page.getByLabel("Committee role");
  const memberOptions = await memberSelect.locator("option").all();
  if (memberOptions.length <= 1) {
    test.skip();
    return;
  }
  await memberSelect.selectOption({ index: 1 });
  const roleOptions = await roleSelect.locator("option").all();
  if (roleOptions.length <= 1) {
    test.skip();
    return;
  }
  await roleSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Save assignment" }).click();
  await expect(page.getByText("Committee assignment saved.")).toBeVisible({
    timeout: 15_000,
  });
});
