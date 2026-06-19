import { expect, test } from "@playwright/test";
import { expectOperationalShell, hasRoleCredentials, loginAs } from "./auth";

test.describe("Online documented smoke test", () => {
  test.skip(!hasRoleCredentials("ADMIN"), "Set SBTS_E2E_ADMIN_USERNAME and SBTS_E2E_ADMIN_PASSWORD to run online tests.");

  test("admin can login and open core operator pages", async ({ page }) => {
    await loginAs(page, "ADMIN");
    await page.goto("/dashboard");
    await expectOperationalShell(page);

    for (const path of ["/areas", "/projects", "/approvals", "/reports", "/settings"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toContainText(/application error|unexpected error|failed to fetch/i);
    }
  });

  test("monitoring page is reachable by admin", async ({ page }) => {
    await loginAs(page, "ADMIN");
    await page.goto("/monitoring");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/Monitoring|Performance|Database|API|Errors/i);
  });
});
