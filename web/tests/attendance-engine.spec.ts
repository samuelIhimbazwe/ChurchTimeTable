import { expect, test } from "@playwright/test";

test("leader can open attendance governance workspace", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/attendance$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Attendance governance" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Mark attendance" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choir attendance" })).toBeVisible();
});

test("leader can navigate attendance oversight tabs", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/attendance");

  await page.getByRole("button", { name: "Ministry oversight" }).click();
  await expect(
    page.getByRole("heading", { name: "President dashboard" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Coordinator oversight" }).click();
  await expect(
    page.getByRole("heading", { name: "Coordinator dashboard" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Choir attendance" }).click();
  await expect(page.getByText("Choir attendance", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("super admin can view attendance scoring weights", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });

  await page.goto("/en/dashboard/admin");
  await expect(page).toHaveURL(/\/en\/dashboard\/admin$/, { timeout: 60_000 });
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByText("Super admin workspace")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "Attendance scoring weights" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Save weights" })).toBeVisible();
});
