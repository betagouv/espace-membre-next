import { test, expect } from "@playwright/test";
import { addMonths } from "date-fns/addMonths";
import { format } from "date-fns/format";

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

test("cannot add date with more than 6 months if status is independant", async ({
    page,
}) => {
    const randomBio = "io " + Math.random();
    const dateIn8Months = addMonths(new Date(), 8);

    await page.goto("/account");

    await page.getByText("Modifier la fiche").first().click();

    await page.waitForURL("/account/base-info");

    await page.getByLabel("Courte bio").fill(randomBio);
    await page
        .getByLabel("Type de contrat (obligatoire)")
        .selectOption("Indépendant");
    await page
        .getByLabel("Date de fin de mission (obligatoire)")
        .fill(format(dateIn8Months, "dd/MM/YYYY"));

    await page.getByText("Enregistrer").click();

    expect(
        await page.getByText(
            "La date de fin de mission ne peut pas être supérieure à 6 mois dans le futur."
        )
    );
});
