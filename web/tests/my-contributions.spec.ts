import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });
}

test("member can open my contributions page", async ({ page }) => {
  await signIn(page, "member1@church.local");
  await page.goto("/en/dashboard/finance/my-contributions");
  await expect(page).toHaveURL(/\/en\/dashboard\/finance\/my-contributions$/, {
    timeout: 60_000,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: "My contributions" }),
  ).toBeVisible({ timeout: 30_000 });
});

test("choir treasurer cannot access another member via mine endpoint", async ({
  request,
}) => {
  const login = await request.post("http://localhost:3001/api/auth/login", {
    data: { email: "choir.treasurer@church.local", password: PILOT_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { data } = await login.json();
  const token = data.accessToken as string;

  const res = await request.get(
    "http://localhost:3001/api/finance/contributions/mine",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.summary).toBeDefined();
});
