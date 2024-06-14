import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("account page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Valid member").first()).toBeVisible();
    await expect(
        page.getByText("Email principal : valid.member@betagouv.ovh").first()
    ).toBeVisible();
});

//
// TODO: not shown for valid.member
//
// test("show correct webmail link", async ({ page }) => {
//     await page.goto("/");
//     await page
//         .getByRole("button", { name: "Accéder au webmail" })
//         .click({ force: true });
//     const webmailLink = page.getByRole("link").getByText("Webmail");
//     await expect(await webmailLink.getAttribute("href")).toEqual(
//         "https://www.ovhcloud.com/fr/mail/"
//     );
// });
