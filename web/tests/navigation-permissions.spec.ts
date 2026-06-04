import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("event:read member cannot create events in event engine", async ({ page }) => {
  await login(page, "member1@church.local");
  await page.goto("/en/dashboard/events");
  await expect(page.getByRole("heading", { level: 1, name: "Event engine" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Create event" })).toHaveCount(0);
});

test("event:write leader sees create event control", async ({ page }) => {
  await login(page, "choir.president@church.local");
  await page.goto("/en/dashboard/events");
  await expect(page.getByRole("button", { name: "Create event" })).toBeVisible({
    timeout: 30_000,
  });
});

test("finance nav uses scoped permissions not finance:read alone", async ({ page }) => {
  await login(page, "member1@church.local");
  await expect(page.getByRole("link", { name: "Finance" })).toHaveCount(0);

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.treasurer@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "Finance" })).toBeVisible({
    timeout: 30_000,
  });
});

test("coverage and attendance nav align with operational permissions", async ({ page }) => {
  await login(page, "choir.president@church.local");
  await expect(page.getByRole("link", { name: "Coverage" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "Attendance" })).toBeVisible({
    timeout: 30_000,
  });
});
