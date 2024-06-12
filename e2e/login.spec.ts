import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Me connecter / Espace Membre");
});

test("submit invalid login returns error message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("pouet.pouet@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await expect(
        page.getByText(
            "Error: Le membre pouet.pouet@betagouv.ovh n'a pas de fiche github."
        )
    ).toBeVisible();
});

test("submit expired login returns error message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("expired.member@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await expect(
        page.getByText(
            "Error: Membre Expired member a une date de fin expirée sur Github."
        )
    ).toBeVisible();
});

test("submit valid login returns correct message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("lucas.charrier@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await expect(
        page.getByText(
            "Un email avec un lien de connexion a été envoyé à ton adresse."
        )
    ).toBeVisible();
});

test("magic link allows connection", async ({ page, browser }) => {
    const context = await browser.newContext();
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

    await expect(
        iframe.getByRole("heading").getByText("Mon compte", { exact: true })
    ).toBeVisible();

    await expect(
        iframe
            .getByRole("link")
            .getByText("Mise à jour de mes informations", { exact: true })
    ).toBeVisible();
});
