// Définitions des étapes pour la fonctionnalité de connexion.
//
// Remarque : les fonctions de définitions d'étapes de Cucumber sont toujours
// `Given` / `When` / `Then` (ou `defineStep`) en JavaScript — les mots-clés
// français (`Quand`, `Alors`, `Et`, …) ne sont reconnus que dans les fichiers
// `.feature`. Cucumber associe une étape à partir de son texte, quel que soit
// le mot-clé Gherkin utilisé dans le fichier `.feature`.
import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import type World from "./world";

When("je me rends sur la page d'accueil", async function (this: World) {
  await this.page.goto(this.appUrl + "/");
});

Then(
  "le titre de la page est {string}",
  async function (this: World, expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  },
);

Then("je peux voir un lien {string}", async function (this: World, text: string) {
  await expect(this.page.getByText(text).first()).toBeVisible();
});
