import { test, expect, Page } from "@playwright/test";

test.use({ storageState: "./playwright-auth-valid.member.json" });

const openStartup = async (page: Page, name: string) => {
  await page.goto("/startups");

  await page.getByPlaceholder("Choisissez une startup").fill(name);
  await page.getByRole("option", { name, exact: true }).click();

  const firstRow = page
    .getByRole("table")
    .locator("tbody")
    .getByRole("row")
    .nth(0);
  await expect(firstRow.getByText(name)).toBeVisible();
  await firstRow.getByText(name).click();

  await expect(page.getByRole("heading").getByText(name)).toBeVisible();
};

// valid.member n'a de mission que sur la startup co-incubee (seed).
test("search and edit valid product", async ({ page }) => {
  await openStartup(page, "Startup co-incubée");

  await page.getByRole("link").getByText("Modifier la fiche").first().click();

  await expect(
    page
      .getByRole("heading")
      .getByText("Modifier la fiche produit de Startup co-incubée"),
  ).toBeVisible();
});

test("hide edit link on a product without mission", async ({ page }) => {
  await openStartup(page, "Startup 1");

  await expect(
    page.getByRole("link").getByText("Modifier la fiche"),
  ).toHaveCount(0);

  await page.goto(`${page.url()}/info-form`);

  await expect(page).not.toHaveURL(/info-form/);
  await expect(page.getByRole("heading").getByText("Startup 1")).toBeVisible();
});
