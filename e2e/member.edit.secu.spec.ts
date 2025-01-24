import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test.describe.configure({ mode: "serial" });

test("cannot use /admin-update", async ({ page }) => {
    await page.goto("/community/expired.member/admin-update");

    // redirected to my page
    await page.waitForURL("/community/expired.member");

    await page
        .getByRole("heading")
        .getByText("Expired member", { exact: true })
        .textContent();
});

test("cannot use /update on non expired member account", async ({ page }) => {
    await page.goto("/community/another.member/update");
    // redirected
    await page.waitForURL("/community/another.member");
    await page
        .getByRole("heading")
        .getByText("Another member", { exact: true })
        .textContent();
});

test("can use /update for expired member account", async ({ page }) => {
    await page.goto("/community/expired.member/update");

    await page
        .getByLabel("Date de fin de mission (obligatoire)")
        .fill("2030-10-10");

    await page.waitForTimeout(100);

    await page.getByRole("button").getByText("Enregistrer").click();
    await page.getByText("Modifications enregistrées");

    await page.goto("/community/expired.member");
    await page.waitForURL("/community/expired.member");
    await page.reload(); // for some reason its not properly reloaded

    await page
        .getByRole("heading")
        .getByText("Expired member", { exact: true })
        .textContent();
});
