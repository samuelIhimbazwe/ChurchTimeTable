import { expect, test } from "@playwright/test";

const PILOT_PASSWORD = "Pilot@123";
const API = "http://localhost:3001/api";

async function tokenFor(email: string, request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${API}/auth/login`, {
    data: { email, password: PILOT_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { data } = await login.json();
  return data.accessToken as string;
}

test("treasurer can approve pending expense via API", async ({ request }) => {
  const presidentToken = await tokenFor("choir.president@church.local", request);
  const treasurerToken = await tokenFor("choir.treasurer@church.local", request);

  const create = await request.post(`${API}/finance/transactions`, {
    headers: { Authorization: `Bearer ${presidentToken}` },
    data: {
      ministryScope: "CHOIR",
      type: "EXPENSE",
      category: "OPERATIONAL_SUPPORT",
      amount: 750,
      description: `Playwright approval ${Date.now()}`,
    },
  });
  expect(create.ok()).toBeTruthy();
  const created = (await create.json()).data;
  expect(created.approvalStatus).toBe("PENDING");

  const approve = await request.post(`${API}/finance/transactions/${created.id}/approve`, {
    headers: { Authorization: `Bearer ${treasurerToken}` },
    data: { approve: true },
  });
  expect(approve.ok()).toBeTruthy();
  const approved = (await approve.json()).data;
  expect(approved.approvalStatus).toBe("APPROVED");
});

test("choir treasurer sees pending approvals panel in stewardship UI", async ({
  page,
  request,
}) => {
  const presidentToken = await tokenFor("choir.president@church.local", request);
  const stamp = Date.now();
  const create = await request.post(`${API}/finance/transactions`, {
    headers: { Authorization: `Bearer ${presidentToken}` },
    data: {
      ministryScope: "CHOIR",
      type: "EXPENSE",
      category: "OPERATIONAL_SUPPORT",
      amount: 800,
      description: `PW UI approval ${stamp}`,
    },
  });
  expect(create.ok()).toBeTruthy();

  await page.goto("/en/login");
  await page.getByLabel("Email").fill("choir.treasurer@church.local");
  await page.getByLabel("Password").fill(PILOT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 60_000 });

  await page.goto("/en/dashboard/finance");
  await expect(
    page.getByRole("heading", { level: 1, name: "Finance stewardship" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Pending approvals" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible({
    timeout: 15_000,
  });
});
