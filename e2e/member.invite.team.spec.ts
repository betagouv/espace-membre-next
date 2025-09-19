import { test, expect } from "@playwright/test";
import { createNewMember } from "./member.invite.utils";

test.use({ storageState: "./playwright-auth-valid.team.member.json" });

test("as an incubator member, i can create a new member straight away", async ({
  page,
}) => {
  await createNewMember(page, {
    nom: "nouveauNom2",
    prenom: "nouveauPrenom2",
    startup: "Startup 2",
  });

  await expect(page.getByText("C'est presque bon !")).toBeVisible();
  await expect(
    page.getByText(
      "nouveauPrenom2 nouveauNom2 va recevoir un email pour l'inviter à se connecter à l'espace membre et compléter sa fiche",
    ),
  ).toBeVisible();

  await page.goto("/community/nouveau-prenom2.nouveau-nom2");
  await page.waitForURL("/community/nouveau-prenom2.nouveau-nom2");

  await expect(
    page.getByText(
      "nouveauPrenom2 nouveauNom2 n'a pas encore activé son compte.",
    ),
  ).toBeVisible();

  // todo: ensure verification email has been sent
  // todo: verify email and login with new user
});
