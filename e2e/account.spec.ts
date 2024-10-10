import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("account page", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("Valid member").first()).toBeVisible();
    await expect(
        page.getByRole("heading").getByText("Valid member").first()
    ).toBeVisible();
    await expect(
        page.getByRole("table").getByText("valid.member@betagouv.ovh").first()
    ).toBeVisible();
});
