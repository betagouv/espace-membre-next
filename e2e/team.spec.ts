import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("team list page", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText("Rechercher une équipe").first()).toBeVisible();
});

test("team detail page and form page", async ({ page }) => {
    const incubator = await db
        .insertInto("incubators")
        .values({
            title: "Mon super incubateur",
        })
        .returning("uuid")
        .executeTakeFirst();
    const team = await db
        .insertInto("teams")
        .values({
            name: "Ma super team",
            incubator_id: incubator?.uuid as string,
        })
        .returning("uuid")
        .executeTakeFirst();
    await page.goto(`/teams/${team?.uuid}`);
    await expect(page.getByText("Ma super team").first()).toBeVisible();
    await page.getByText("Modifier la fiche").first().click();
    await page.waitForURL(`/teams/${team?.uuid}/info-form`);
    await expect(
        page.getByText("Modifier la fiche équipe de Ma super team").first()
    ).toBeVisible();
    if (team) {
        await db.deleteFrom("teams").where("uuid", "=", team?.uuid).execute();
    }
    if (incubator) {
        await db
            .deleteFrom("incubators")
            .where("uuid", "=", incubator?.uuid)
            .execute();
    }
});

test("team create page", async ({ page }) => {
    await page.goto(`/teams/create-form`);
    await expect(
        page.getByText("Créer une fiche équipe").first()
    ).toBeVisible();
});
