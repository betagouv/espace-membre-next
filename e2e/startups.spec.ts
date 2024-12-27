import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("search and edit valid product", async ({ page }) => {
    await page.goto("/startups");
    await page.getByPlaceholder("Sélectionne un produit").fill("Startup 1");
    await page.getByRole("option", { name: "Startup 1", exact: true }).click();

    await page.getByRole("button").getByText("Voir ce produit").click();
    await page.waitForTimeout(100);

    await expect(
        await page.getByRole("heading").getByText("Startup 1")
    ).toBeVisible();

    await page.getByRole("link").getByText("Modifier la fiche").click();

    await expect(
        await page
            .getByRole("heading")
            .getByText("Modifier la fiche produit de Startup 1")
    ).toBeVisible();
});
