import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test.describe("Member profile center", () => {
  test("member can open own profile from dashboard link", async ({ page }) => {
    await signIn(page, "choir.member1@church.local");
    await page.getByRole("link", { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/members\//);
    await expect(page.getByText(/overview/i)).toBeVisible();
  });

  test("president can open member profile from directory", async ({ page }) => {
    await signIn(page, "choir.president@church.local");
    await page.goto("/en/dashboard/members");
    await page.getByRole("link", { name: /profile/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/members\//);
    await expect(page.getByText(/timeline/i)).toBeVisible();
  });
});
