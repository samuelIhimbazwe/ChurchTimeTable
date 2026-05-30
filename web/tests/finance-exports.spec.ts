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

test("choir treasurer can export scoped ministry csv", async ({ request }) => {
  const token = await tokenFor("choir.treasurer@church.local", request);
  const res = await request.get(`${API}/finance/export/csv?ministryScope=CHOIR`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("text/csv");
});

test("member cannot export ministry finance", async ({ request }) => {
  const token = await tokenFor("member1@church.local", request);
  const res = await request.get(`${API}/finance/export/csv?ministryScope=CHOIR`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(403);
});

test("member can export personal contributions pdf", async ({ request }) => {
  const token = await tokenFor("member1@church.local", request);
  const res = await request.get(`${API}/finance/contributions/mine/export/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("pdf");
});
