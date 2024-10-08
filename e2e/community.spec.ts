import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("search valid community members", async ({ page }) => {
    // await page.route("**/api/get-users**", async (route) => {
    //     const response = await route.fetch();
    //     const json = await response.json();
    //     expect(json.users.length).toEqual(2);
    //     await route.fulfill({ response, json });
    // });

    await page.goto("/community");
    await page
        .getByPlaceholder("Sélectionne un statut")
        .fill("Membres actifs");
    await page
        .getByRole("option", { name: "Membres Actifs", exact: true })
        .click();

    const responsePromise = page.waitForResponse((response) => {
        return true;
    });
    await page.getByRole("button").getByText("Chercher").click();
    await responsePromise;
    await page.waitForTimeout(100);

    const rows = await page
        .getByRole("grid")
        .locator(".tabulator-tableholder")
        .getByRole("row");

    await expect(await rows.count()).toEqual(1);
    await expect(
        rows.nth(0).getByText("valid.member@betagouv.ovh")
    ).toBeVisible();
    await expect(await rows.nth(0).getByText("Valid member")).toBeVisible();
});
