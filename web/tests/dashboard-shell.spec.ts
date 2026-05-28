import { expect, test } from "@playwright/test";

test("member users land on the member dashboard without admin navigation", async ({
  page,
}) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { name: "Upcoming schedule" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Contribution progress" }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "Admin console" })).toHaveCount(0);
});

test("leader users see operations analytics in the shared shell", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { name: "Attendance trend" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Reliability indicators" }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "Admin console" })).toHaveCount(0);
});

test("super admins can switch locale and open admin console inside the shell", async ({
  page,
}) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByText("Super admin workspace")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "Admin console" })).toBeVisible();

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await Promise.all([
    page.waitForURL(/\/fr\/dashboard$/, { timeout: 30_000 }),
    page.getByLabel("Select locale").selectOption("fr"),
  ]);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr", {
    timeout: 30_000,
  });
  await expect(page.getByText("Espace super admin")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("link", { name: "Console admin" }).click();
  await expect(page).toHaveURL(/\/fr\/dashboard\/admin$/, { timeout: 30_000 });
  await expect(page.getByText("Tableau de bord super admin")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Espace super admin")).toBeVisible({ timeout: 30_000 });
});
