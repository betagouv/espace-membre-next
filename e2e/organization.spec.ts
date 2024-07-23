import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("organization list page", async ({ page }) => {
    await page.goto("/organizations");
    await expect(
        page.getByText("Rechercher une organisation sponsor").first()
    ).toBeVisible();
});

test("organization detail page and form page", async ({ page }) => {
    const organization = await db
        .insertInto("organizations")
        .values({
            name: "Mon super sponsor",
            type: SponsorType.SPONSOR_TYPE_ADMINISTRATION_CENTRALE,
            domaine_ministeriel:
                SponsorDomaineMinisteriel.SPONSOR_DOMAINE_ARMEES,
        })
        .returning("uuid")
        .executeTakeFirst();
    await page.goto(`/organizations/${organization?.uuid}`);
    await expect(page.getByText("Mon super sponsor").first()).toBeVisible();
    await page.getByText("✏️ Mettre à jour les infos").first().click();
    await page.waitForURL(`/organizations/${organization?.uuid}/info-form`);
    await expect(
        page.getByText("Modifier la fiche de Mon super sponsor").first()
    ).toBeVisible();
    if (organization) {
        await db
            .deleteFrom("organizations")
            .where("uuid", "=", organization?.uuid)
            .execute();
    }
});

test("organization create page", async ({ page }) => {
    await page.goto(`/organizations/create-form`);
    await expect(
        page.getByText("Créer une fiche organisation sponsor").first()
    ).toBeVisible();
});
