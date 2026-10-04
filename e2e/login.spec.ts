import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Me connecter / Espace Membre");
});

test("login is ProConnect only, without email form", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: /ProConnect/i }).first(),
  ).toBeVisible();
  await expect(page.getByText("Se connecter par email")).toHaveCount(0);
  await expect(page.getByText("Recevoir le lien de connexion")).toHaveCount(0);
  await expect(page.getByLabel("Mon email")).toHaveCount(0);
});

test("unknown member error explains to use the primary email", async ({
  page,
}) => {
  await page.goto("/login?error=UnknownMember");

  await expect(
    page.getByText(
      "Aucun membre ne correspond à ce compte. Connecte-toi avec ton adresse @beta.gouv.fr ou ton adresse du service public (pas ton email personnel).",
    ),
  ).toBeVisible();
});

test("expired member error is displayed", async ({ page }) => {
  await page.goto("/login?error=ExpiredMember");

  await expect(
    page.getByText(
      "Ce membre a une date de fin expirée ou pas de mission définie.",
    ),
  ).toBeVisible();
});

test("login page links to the public support page", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Consulte la page d'aide" }).click();

  await page.waitForURL("/support");
  await expect(
    page.getByRole("heading", { name: "Aide à la connexion" }),
  ).toBeVisible();
});
