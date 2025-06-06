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
            "Membre inconnu dans la communauté, veuillez contacter votre équipe référente."
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
            "Ce membre a une date de fin expirée ou pas de mission définie."
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
            "Ce membre a une date de fin expirée ou pas de mission définie."
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
    await page.waitForURL("/dashboard");

    await expect(
        page.getByRole("heading").getByText("Gérer mon compte", { exact: true })
    ).toBeVisible();

    await expect(
        page.getByRole("link").getByText("Ma fiche membre", { exact: true })
    ).toBeVisible();
});

test("valid login sends magic link and redirect to the page pass in next searchParans", async ({
    page,
    browser,
}) => {
    await page.goto("/login?next=/community/valid.member");
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
    await page.waitForURL("/community/valid.member");
    const url = new URL(page.url());
    const pathname = url.pathname;
    // Verify the URL is correct after redirection
    expect(pathname).toBe("/community/valid.member");
});

// test with redirect to //evil.com
test("valid login sends magic link and but the callback url is changed to be evil website (//evil.com), should be ignore and redirect to /dashboard", async ({
    page,
    browser,
}) => {
    await page.goto("/login?next=/community/valid.member");
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

    // Get the original magic link (href) from the email
    const originalHref = await iframe
        .getByText("Me connecter", { exact: true })
        .getAttribute("href");

    // Ensure that we have a valid href
    if (!originalHref) {
        throw new Error("Magic link not found in the email.");
    }

    // Parse the fragment as a URL
    const modifiedHref = new URL(originalHref);

    // Modify the callbackUrl parameter
    modifiedHref.searchParams.set("callbackUrl", "//evil.com");

    // Rebuild the full URL with the modified callbackUrl
    // Navigate to the modified URL
    await page.goto(modifiedHref.toString());
    await page.getByText("Me connecter").first().click();
    await page.waitForURL("/dashboard");
    const url = new URL(page.url());
    const pathname = url.pathname;
    // Verify the URL is correct after redirection
    expect(pathname).toBe("/dashboard");
});

// test with redirect to /\evil.com
test(`valid login sends magic link and but the callback url is changed to be evil website (/\evil.com), should be ignore and redirect to /dashboard`, async ({
    page,
    browser,
}) => {
    await page.goto("/login?next=/community/valid.member");
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

    // Get the original magic link (href) from the email
    const originalHref = await iframe
        .getByText("Me connecter", { exact: true })
        .getAttribute("href");

    // Ensure that we have a valid href
    if (!originalHref) {
        throw new Error("Magic link not found in the email.");
    }

    // Parse the URL and fragment (the part after the #)
    // const [baseUrl, fragment] = originalHref.split("#");

    // // Parse the fragment as a URL
    // const fragmentUrl = new URL(fragment);
    const modifiedHref = new URL(originalHref);

    // Modify the callbackUrl parameter
    modifiedHref.searchParams.set("callbackUrl", `/\\evil.com`);

    // Rebuild the full URL with the modified callbackUrl
    // const modifiedHref = `${baseUrl}?${fragmentUrl.toString()}`;
    // Navigate to the modified URL
    await page.goto(modifiedHref.toString());
    await page.getByText("Me connecter").first().click();
    await page.waitForURL("/dashboard");
    const url = new URL(page.url());
    const pathname = url.pathname;
    // Verify the URL is correct after redirection
    expect(pathname).toBe("/dashboard");
});
