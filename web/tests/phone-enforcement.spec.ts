import { expect, test } from "@playwright/test";

async function mockPhoneEnforcement(
  page: import("@playwright/test").Page,
  mode: "warning" | "strict",
) {
  await page.route("**/api/v1/auth/me", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.member = {
      ...(body.data.member ?? {}),
      status: "ACTIVE",
      phone: null,
      missingPhone: true,
    };
    body.data.phoneEnforcement = {
      enabled: true,
      mode,
      blocked: mode === "strict",
    };
    await route.fulfill({
      response,
      json: body,
    });
  });
}

test("warning banner appears for incomplete phone", async ({ page }) => {
  await mockPhoneEnforcement(page, "warning");

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(
    page.getByText(
      "Complete your phone number to avoid losing access to ministry tools.",
    ),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: "Update now" })).toBeVisible();
});

test("strict mode redirects blocked routes to profile", async ({ page }) => {
  await mockPhoneEnforcement(page, "strict");

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });

  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/settings\/profile$/, {
    timeout: 30_000,
  });
  await expect(
    page.getByText("Phone number required to continue ministry operations."),
  ).toBeVisible();
});

test("strict mode hides blocked navigation sections", async ({ page }) => {
  await mockPhoneEnforcement(page, "strict");

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.president@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "Attendance" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
});

test("profile save clears strict block in session", async ({ page }) => {
  let blocked = true;

  await page.route("**/api/v1/auth/me", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.member = {
      ...(body.data.member ?? {}),
      status: "ACTIVE",
      phone: blocked ? null : "0781111111",
      missingPhone: blocked,
    };
    body.data.phoneEnforcement = {
      enabled: true,
      mode: "strict",
      blocked,
    };
    await route.fulfill({ response, json: body });
  });

  await page.route("**/api/v1/users/me", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }

    blocked = false;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          member: {
            phone: "0781111111",
            missingPhone: false,
          },
        },
      }),
    });
  });

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("member1@church.local");
  await page.getByLabel("Password").fill("Pilot@123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 60_000 });
  await page.goto("/en/dashboard/settings/profile");

  const phoneInput = page.getByLabel("Phone");
  await phoneInput.fill("0781111111");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByText("Profile updated.")).toBeVisible({
    timeout: 30_000,
  });

  await page.goto("/en/dashboard/attendance");
  await expect(page).toHaveURL(/\/en\/dashboard\/attendance$/, {
    timeout: 30_000,
  });
});
