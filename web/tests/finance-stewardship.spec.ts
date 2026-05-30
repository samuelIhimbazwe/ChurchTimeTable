import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("choir treasurer can open finance stewardship", async ({ page }) => {
  await signIn(page, "choir.treasurer@church.local");
  await page.goto("/en/dashboard/finance");
  await expect(page).toHaveURL(/\/en\/dashboard\/finance$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Finance stewardship" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Ministry balance")).toBeVisible();
});

test("protocol president sees finance nav but scoped oversight", async ({
  page,
}) => {
  await signIn(page, "protocol.president@church.local");
  await page.goto("/en/dashboard/finance");
  await expect(page).toHaveURL(/\/en\/dashboard\/finance$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Finance stewardship" }),
  ).toBeVisible({ timeout: 30_000 });
});

test("plain member cannot access finance stewardship page", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/finance");
  await expect(page).not.toHaveURL(/\/en\/dashboard\/finance$/, { timeout: 15_000 });
});
