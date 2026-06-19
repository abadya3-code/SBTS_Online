import { expect, test } from "@playwright/test";
import { expectAccessDeniedOrRedirect, hasRoleCredentials, loginAs } from "./auth";

test.describe("Admin / Supervisor / Technician matrix", () => {
  test.skip(!hasRoleCredentials("ADMIN"), "Admin credentials are required for baseline role matrix.");

  test("admin can access restricted administration surfaces", async ({ page }) => {
    await loginAs(page, "ADMIN");
    for (const path of ["/access-control", "/users", "/audit", "/monitoring"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toContainText(/forbidden|not authorized|access denied/i);
    }
  });

  test("technician cannot access admin-only surfaces", async ({ page }) => {
    test.skip(!hasRoleCredentials("TECHNICIAN"), "Technician credentials are optional but required for this check.");
    await loginAs(page, "TECHNICIAN");
    for (const path of ["/access-control", "/users", "/monitoring"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectAccessDeniedOrRedirect(page);
    }
  });

  test("supervisor/coordinator cannot edit AccessControl", async ({ page }) => {
    test.skip(!hasRoleCredentials("SUPERVISOR"), "Supervisor credentials are optional but required for this check.");
    await loginAs(page, "SUPERVISOR");
    await page.goto("/access-control");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Save model|ACCESS_ROLE_MODEL_SAVED/i);
  });
});
