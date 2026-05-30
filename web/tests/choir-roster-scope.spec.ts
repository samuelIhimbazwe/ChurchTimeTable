import { expect, test } from "@playwright/test";

test("choir president marking list excludes protocol-only services", async ({
  page,
}) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });

  await page.goto("/en/dashboard/attendance");
  await expect(
    page.getByRole("heading", { level: 1, name: "Attendance governance" }),
  ).toBeVisible({ timeout: 30_000 });

  const protocolService = page.getByText("Serivisi Protocol", { exact: false });
  await expect(protocolService).toHaveCount(0);
});
