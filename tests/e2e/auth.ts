import { expect, type Page } from "@playwright/test";

export type E2ERole = "ADMIN" | "SUPERVISOR" | "TECHNICIAN";

export function hasRoleCredentials(role: E2ERole): boolean {
  return Boolean(process.env[`SBTS_E2E_${role}_USERNAME`] && process.env[`SBTS_E2E_${role}_PASSWORD`]);
}

export async function loginAs(page: Page, role: E2ERole) {
  const username = process.env[`SBTS_E2E_${role}_USERNAME`];
  const password = process.env[`SBTS_E2E_${role}_PASSWORD`];
  if (!username || !password) throw new Error(`Missing SBTS_E2E_${role}_USERNAME or SBTS_E2E_${role}_PASSWORD`);

  await page.goto("/login");
  const usernameInput = page
    .locator('input[name*="user" i], input[placeholder*="user" i], input[placeholder*="badge" i], input[type="text"], input:not([type])')
    .first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(usernameInput).toBeVisible();
  await usernameInput.fill(username);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(password);

  const submit = page.getByRole("button", { name: /login|sign in|password|دخول/i }).last();
  await submit.click();
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(/\/login$/i, { timeout: 15_000 });
}

export async function expectOperationalShell(page: Page) {
  await expect(page.getByText(/SBTS|Smart Blind Tag|Dashboard|Projects/i).first()).toBeVisible({ timeout: 15_000 });
}

export async function expectAccessDeniedOrRedirect(page: Page) {
  const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
  expect(bodyText).toMatch(/forbidden|not authorized|access denied|dashboard|login|غير مصرح|لا تملك/i);
}
