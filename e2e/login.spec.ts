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
            "Error: Il n'y a pas de fiche dans l'espace-membre pour cet email. Un membre de la communauté peut en créer une."
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
            "Error: Membre Expired member a une date de fin expirée ou pas de mission définie."
        )
    ).toBeVisible();
});

test("submit mission-less login returns error message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mon email").fill("empty.member@betagouv.ovh");
    await page.getByText("Recevoir le lien de connexion").click();
    await page.waitForTimeout(2000);

    await expect(
        page.getByText(
            "Error: Membre Empty member a une date de fin expirée ou pas de mission définie."
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
    await page.getByText("Me connecter").first().click();
    await page.waitForURL("/account");

    await expect(
        page.getByRole("heading").getByText("Mon compte", { exact: true })
    ).toBeVisible();

    await expect(
        page
            .getByRole("link")
            .getByText("Mise à jour de mes informations", { exact: true })
    ).toBeVisible();
});
