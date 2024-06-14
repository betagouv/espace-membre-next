import { test as setup, expect } from "@playwright/test";

const adminFile = "./playwright-auth-valid.member.json";

setup("authenticate as valid.member through magic link", async ({ page }) => {
    // fill login form
    await page.goto("/");
    await page.getByLabel("Mon email").fill("valid.member@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();

    // wait a while to get the latest email
    await page.waitForTimeout(1000);

    // open maildev and click the first invitation link
    await page.goto("http://127.0.0.1:1080");
    await page
        .getByText("Connexion à l'espace membre BetaGouv")
        .first()
        .click();

    // get the magic link from the email preview
    const iframe = await page.frameLocator(".preview-iframe").first();
    await iframe.getByText("Me connecter", { exact: true }).click();
    const href =
        (await iframe
            .getByText("Me connecter", { exact: true })
            .getAttribute("href")) || "/";

    // open magic link
    await page.goto(href);
    await page.waitForURL("/account");
    await expect(
        page.getByText("Mon compte", { exact: true }).first()
    ).toBeVisible();

    await page.context().storageState({ path: adminFile });
});
