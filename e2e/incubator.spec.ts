import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("incubator list page", async ({ page }) => {
    await page.goto("/incubators");
    await expect(
        page.getByText("Rechercher un incubateur").first()
    ).toBeVisible();
});

test("incubator detail page and form page", async ({ page }) => {
    const incubator = await db
        .insertInto("incubators")
        .values({
            title: "Mon super incubateur",
            ghid: "mon-super-incubateur-e2e",
        })
        .returning("uuid")
        .executeTakeFirst();
    await page.goto(`/incubators/${incubator?.uuid}`);
    await expect(page.getByText("Mon super incubateur").first()).toBeVisible();
    await page.getByText("Modifier la fiche").first().click();
    await page.waitForURL(`/incubators/${incubator?.uuid}/info-form`);
    await expect(
        page
            .getByText("Modifier la fiche incubateur de Mon super incubateur")
            .first()
    ).toBeVisible();
    if (incubator) {
        await db
            .deleteFrom("incubators")
            .where("uuid", "=", incubator?.uuid)
            .execute();
    }
});

/**
 * La création d'incubateur est désormais réservée aux admins, jusqu'à sa page
 * d'entrée : offrir le formulaire à quelqu'un dont le submit sera refusé lui
 * fait perdre sa saisie. `valid.member` n'est pas admin, et aucun compte ne
 * l'est en e2e puisque .env.test ne définit pas ESPACE_MEMBRE_ADMIN.
 *
 * Le chemin admin, lui, n'est pas couvert ici : il faudrait un second état
 * d'authentification et un admin déclaré dans l'environnement de test.
 */
test("incubator create page redirects a non-admin", async ({ page }) => {
    await page.goto(`/incubators/create-form`);
    await page.waitForURL("/dashboard");
    await expect(
        page.getByText("Créer une fiche incubateur")
    ).toHaveCount(0);
});
