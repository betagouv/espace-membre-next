import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("search valid community members", async ({ page }) => {
    await page.goto("/community");
    await page.waitForURL("/community");

    await page.getByText("Membres actifs uniquement").click();

    await page.waitForTimeout(500);

    const rows = await page
        .getByRole("table")
        .locator("tbody")
        .getByRole("row");

    await expect(await rows.count()).toEqual(2);

    await expect(await rows.nth(0).getByText("Another member")).toBeVisible();
    await expect(await rows.nth(1).getByText("Valid member")).toBeVisible();

    await page.getByText("Membres actifs uniquement").click();

    const rows2 = await page
        .getByRole("table")
        .locator("tbody")
        .getByRole("row");

    await expect(await rows2.count()).toEqual(5);
});

test("can view other members", async ({ page }) => {
    await page.goto("/community/another.member");
    await page.waitForURL("/community/another.member");
    await expect(
        await page.getByRole("heading").getByText("Another member")
    ).toBeVisible();
});

test("can view expired member information", async ({ page }) => {
    await page.goto("/community/expired.member");
    await page.waitForURL("/community/expired.member");

    await expect(
        await page.getByRole("heading").getByText("Expired member")
    ).toBeVisible();

    await expect(
        await page.getByText("Fiche arrivée à expiration")
    ).toBeVisible();
});
