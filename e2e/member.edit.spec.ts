import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("can edit my account", async ({ page }) => {
    const randomBio = "io " + Math.random();

    await page.goto("/account");

    await page.getByText("Modifier la fiche").first().click();

    await page.waitForURL("/account/base-info");

    await page.getByLabel("Courte bio").fill(randomBio);
    await page.getByLabel("Statut (obligatoire)").selectOption("EURL");

    await page.getByText("Enregistrer").click();

    await page.getByText("Modifications enregistrées.");

    await page.goto("/account");

    await page.waitForURL("/account");

    expect(await page.getByText(randomBio));
});
