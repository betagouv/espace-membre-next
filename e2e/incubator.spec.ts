import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("incubator list page", async ({ page }) => {
    await page.goto("/incubator");
    await expect(
        page.getByText("Rechercher un incubateur").first()
    ).toBeVisible();
});

test("incubator detail page and form page", async ({ page }) => {
    const incubator = await db
        .insertInto("incubators")
        .values({
            title: "Mon super incubateur",
        })
        .returning("uuid")
        .executeTakeFirst();
    await page.goto(`/incubator/${incubator?.uuid}`);
    await expect(page.getByText("Mon super incubateur").first()).toBeVisible();
    await page.getByText("✏️ Mettre à jour les infos").first().click();
    await page.waitForURL(
        `/incubator/${incubator?.uuid}/1562ecbf-347d-42f2-a60e-6d617e053976/info-form`
    );
    await expect(
        page
            .getByText("Modifier la fiche incubateur de Mon super incubateur")
            .first()
    ).toBeVisible();
    if (incubator) {
        await db.deleteFrom("incubators").where("uuid", "=", incubator?.uuid);
    }
});

test("incubator create page", async ({ page }) => {
    await page.goto(`/incubator/create-form`);
    await expect(
        page.getByText("Créer une fiche incubateur").first()
    ).toBeVisible();
});
