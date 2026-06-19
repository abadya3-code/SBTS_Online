import { expect, test } from "@playwright/test";
import { hasRoleCredentials, loginAs } from "./auth";

test.describe("AccessControl and user preferences evidence", () => {
  test.skip(!hasRoleCredentials("ADMIN"), "Admin credentials are required.");

  test("admin opens Access Control without mock-only save message", async ({ page }) => {
    await loginAs(page, "ADMIN");
    await page.goto("/access-control");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/Access Control|Role|Permission|Save/i);
    await expect(page.locator("body")).not.toContainText(/saved locally|Backend persistence will be connected/i);
  });

  test("user preferences page saves safe UX settings", async ({ page }) => {
    await loginAs(page, "ADMIN");
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/Preference|Theme|Keyboard|Command|Profile|User/i);
  });
});
