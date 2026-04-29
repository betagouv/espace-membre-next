import { test, expect } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("search and edit valid product", async ({ page }) => {
  await page.goto("/startups");

  await page.getByPlaceholder("Choisissez une startup").fill("Startup 1");
  await page.getByRole("option", { name: "Startup 1", exact: true }).click();

  const firstRow = page
    .getByRole("table")
    .locator("tbody")
    .getByRole("row")
    .nth(0);
  await expect(firstRow.getByText("Startup 1")).toBeVisible();
  await firstRow.getByText("Startup 1").click();

  await expect(page.getByRole("heading").getByText("Startup 1")).toBeVisible();

  await page.getByRole("link").getByText("Modifier la fiche").first().click();

  await expect(
    page
      .getByRole("heading")
      .getByText("Modifier la fiche produit de Startup 1"),
  ).toBeVisible();
});
