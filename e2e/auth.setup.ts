import { test as setup, expect } from "@playwright/test";

const adminFile = "./playwright-admin-auth.json";

setup("authenticate as admin", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("lucas.charrier@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await page.waitForTimeout(1000);

    // maildev
    await page.goto("http://127.0.0.1:1080");

    await page
        .getByText("Connexion à l'espace membre BetaGouv")
        .first()
        .click();

    const iframe = await page.frameLocator(".preview-iframe").first();

    await iframe.getByText("Me connecter", { exact: true }).click();

    const href =
        (await iframe
            .getByText("Me connecter", { exact: true })
            .getAttribute("href")) || "/";

    await page.goto(href);

    await page.waitForURL("http://127.0.0.1:8100/account");

    await expect(
        page.getByText("Mon compte", { exact: true }).first()
    ).toBeVisible();

    await page.context().storageState({ path: adminFile });
});
