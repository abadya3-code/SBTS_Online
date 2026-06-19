import { expect, test } from "@playwright/test";
import { hasRoleCredentials, loginAs } from "./auth";

test.describe("Print and certificate regression guard", () => {
  test.skip(!hasRoleCredentials("ADMIN"), "Admin credentials are required.");

  test("print routes keep professional print styles and no runtime crash", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await loginAs(page, "ADMIN");
    for (const path of ["/projects", "/reports"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toContainText(/application error|unexpected error|failed to fetch/i);
    }

    expect(consoleErrors.filter(message => !/favicon|ResizeObserver/i.test(message))).toEqual([]);
  });
});
