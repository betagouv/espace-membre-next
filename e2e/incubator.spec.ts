import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("incubator list page", async ({ page }) => {
    await page.goto("/incubators");
    await expect(page.getByText("Rechercher un incubateur")[1]).toBeVisible();
});

test("incubator detail page and form page", async ({ page }) => {
    const incubator = await db
        .insertInto("incubators")
        .values({
            title: "Mon super incubateur",
        })
        .returning("uuid")
        .executeTakeFirst();
    await page.goto(`/incubators/${incubator?.uuid}`);
    await expect(page.getByText("Mon super incubateur").first()).toBeVisible();
    await page.getByText("✏️ Mettre à jour les infos").first().click();
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

test("incubator create page", async ({ page }) => {
    await page.goto(`/incubators/create-form`);
    await expect(page.getByText("Créer une fiche incubateur")[1]).toBeVisible();
});
