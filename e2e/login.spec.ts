import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Me connecter / Espace Membre");
});

test("submit invalid login returns error message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("pouet.pouet@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await page.waitForTimeout(2000);

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
    await page.waitForTimeout(2000);

    await expect(
        page.getByText(
            "Error: Membre Expired member a une date de fin expirée sur Github."
        )
    ).toBeVisible();
});

test("valid login sends magic link and show correct message", async ({
    page,
    browser,
}) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("valid.member@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await page.waitForTimeout(2000);

    await expect(
        page.getByText(
            "Un email avec un lien de connexion a été envoyé à ton adresse."
        )
    ).toBeVisible();

    // maildev
    await page.goto("http://127.0.0.1:1080");

    await page
        .getByText("Connexion à l'espace membre BetaGouv")
        .first()
        .click();
    await page.waitForTimeout(2000);

    const iframe = await page.frameLocator(".preview-iframe").first();

    const href =
        (await iframe
            .getByText("Me connecter", { exact: true })
            .getAttribute("href")) || "/";

    await page.goto(href);

    await expect(
        page.getByRole("heading").getByText("Mon compte", { exact: true })
    ).toBeVisible();

    await expect(
        page
            .getByRole("link")
            .getByText("Mise à jour de mes informations", { exact: true })
    ).toBeVisible();
});
