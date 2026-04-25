import { test, expect } from "@playwright/test";
import { addMonths } from "date-fns/addMonths";
import { format } from "date-fns/format";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("create member page is accessible", async ({ page }) => {
    await page.goto("/community/create");
    await page.waitForURL("/community/create");
    await expect(
        page.getByRole("heading", { name: "Créer une fiche membre" }).first()
    ).toBeVisible();
});

test("create member form shows required fields", async ({ page }) => {
    await page.goto("/community/create");
    await page.waitForURL("/community/create");

    await expect(page.getByText("Prénom (obligatoire)")).toBeVisible();
    await expect(page.getByText("Nom (obligatoire)")).toBeVisible();
    await expect(page.getByText("Email (obligatoire)")).toBeVisible();
    await expect(page.getByText("Domaine (obligatoire)")).toBeVisible();
});

test("submit button is disabled when form is pristine", async ({ page }) => {
    await page.goto("/community/create");
    await page.waitForURL("/community/create");

    const submitButton = page.getByRole("button", { name: "Créer la fiche" });
    await expect(submitButton).toBeDisabled();
});

test("can create a new member", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstname = "Test";
    const lastname = `E2E${uniqueSuffix}`;
    const email = `test.e2e${uniqueSuffix}@example.com`;
    const endDate = format(addMonths(new Date(), 2), "yyyy-MM-dd");

    await page.goto("/community/create");
    await page.waitForURL("/community/create");

    await page.getByPlaceholder("ex: Grace").fill(firstname);
    await page.getByPlaceholder("ex: HOPPER").fill(lastname);
    await page.getByPlaceholder("ex: grace.hopper@gmail.com").fill(email);

    await page
        .getByLabel("Domaine (obligatoire)")
        .selectOption("Animation");

    await page
        .getByLabel("Début de la mission (obligatoire)")
        .fill(format(new Date(), "yyyy-MM-dd"));

    await page
        .getByLabel("Fin de la mission (obligatoire)")
        .fill(endDate);

    await page
        .getByLabel("Type de contrat (obligatoire)")
        .selectOption("independent");

    await page
        .getByLabel("Entité qui gère la contractualisation (obligatoire)")
        .fill("DINUM");

    await page.waitForTimeout(200);

    const submitButton = page.getByRole("button", { name: "Créer la fiche" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(
        page.getByText("C'est presque bon !").first()
    ).toBeVisible({ timeout: 10000 });

    // cleanup
    const username = `${firstname.toLowerCase()}.${lastname.toLowerCase()}`;
    await db.deleteFrom("users").where("username", "=", username).execute();
});

test("shows error when creating member with duplicate username", async ({
    page,
}) => {
    const firstname = "Valid";
    const lastname = "Member";
    const email = `duplicate.test${Date.now()}@example.com`;
    const endDate = format(addMonths(new Date(), 2), "yyyy-MM-dd");

    await page.goto("/community/create");
    await page.waitForURL("/community/create");

    await page.getByPlaceholder("ex: Grace").fill(firstname);
    await page.getByPlaceholder("ex: HOPPER").fill(lastname);
    await page.getByPlaceholder("ex: grace.hopper@gmail.com").fill(email);

    await page
        .getByLabel("Domaine (obligatoire)")
        .selectOption("Animation");

    await page
        .getByLabel("Début de la mission (obligatoire)")
        .fill(format(new Date(), "yyyy-MM-dd"));

    await page
        .getByLabel("Fin de la mission (obligatoire)")
        .fill(endDate);

    await page
        .getByLabel("Type de contrat (obligatoire)")
        .selectOption("independent");

    await page
        .getByLabel("Entité qui gère la contractualisation (obligatoire)")
        .fill("DINUM");

    await page.waitForTimeout(200);

    await page.getByRole("button", { name: "Créer la fiche" }).click();

    await expect(
        page.getByText("Erreur lors de la création de la fiche").first()
    ).toBeVisible({ timeout: 10000 });
});
