import { expect, test } from "@playwright/test";

/**
 * Visual regression preparation (Sprint 9.1).
 * Run with: npx playwright test visual-regression --update-snapshots
 * to establish baselines when UI is stable.
 */
test.describe("Visual baselines @visual", () => {
  test.skip(!process.env.CMMS_VISUAL_BASELINE, "Set CMMS_VISUAL_BASELINE=1 to run");

  test("login page layout", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page).toHaveScreenshot("login.png", { maxDiffPixelRatio: 0.02 });
  });

  test("member dashboard layout", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("member1@church.local");
    await page.getByLabel("Password").fill("Pilot@123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
    await expect(page.getByText("Member workspace")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveScreenshot("member-dashboard.png", {
      maxDiffPixelRatio: 0.03,
    });
  });
});
