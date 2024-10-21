import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("search valid community members", async ({ page }) => {
    await page.goto("/community");

    await page.getByText("Membres actifs uniquement").click();

    await page.waitForTimeout(500);

    const rows = await page
        .getByRole("table")
        .locator("tbody")
        .getByRole("row");

    await expect(await rows.count()).toEqual(1);

    await expect(await rows.nth(0).getByText("Valid member")).toBeVisible();

    await page.getByText("Membres actifs uniquement").click();

    const rows2 = await page
        .getByRole("table")
        .locator("tbody")
        .getByRole("row");

    await expect(await rows2.count()).toEqual(4);
});
