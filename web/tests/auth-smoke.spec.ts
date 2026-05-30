import { expect, test } from "@playwright/test";

test("protected routes redirect guests to login", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/login\?redirect=/, { timeout: 60_000 });
});

test("locale and theme switching work on the login screen", async ({ page }) => {
  await page.goto("/en/login");

  await expect(
    page.getByRole("heading", { level: 1, name: "Sign in" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("combobox").selectOption("fr");
  await expect(page).toHaveURL(/\/fr\/login/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Connexion" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Sombre" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("invalid login shows a translated error message", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid credentials")).toBeVisible();
});

test("admin login works and refresh restores the session without local auth storage", async ({
  page,
}) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("admin@church.local");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByText("admin@church.local")).toBeVisible();

  const authKeys = await page.evaluate(() =>
    Object.keys(window.localStorage).filter((key) => key.includes("access")),
  );
  expect(authKeys).toEqual([]);

  await page.reload();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByText("Super admin workspace")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("admin@church.local")).toBeVisible({
    timeout: 15_000,
  });
});

test("role guards block non-admin users from the admin route", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/admin");
  await expect(
    page.getByRole("heading", { name: "You do not have access to this area." }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("Your account is authenticated, but your role does not allow this route."),
  ).toBeVisible({ timeout: 30_000 });
});
