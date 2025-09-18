import { test, expect } from "@playwright/test";
import { createNewMember } from "./member.invite.utils";

test.use({ storageState: "./playwright-auth-valid.member.json" });

test("as a regular member, i can create a new member and it needs validation", async ({
  page,
}) => {
  await createNewMember(page, {
    nom: "nouveauNom3",
    prenom: "nouveauPrenom3",
    startup: "Startup 2",
  });

  await expect(page.getByText("C'est presque bon !")).toBeVisible();
  await expect(
    page.getByText(
      "La fiche de nouveauPrenom3 nouveauNom3 est en attente de validation par un membre de l'équipe transverse de son incubateur.",
    ),
  ).toBeVisible();

  await page.goto("/community/nouveau-prenom3.nouveau-nom3");
  await page.waitForURL("/community/nouveau-prenom3.nouveau-nom3");

  await expect(
    page.getByText(
      "La fiche de nouveauPrenom3 nouveauNom3 doit être validée par l'équipe de son incubateur(s) : Incubateur test.",
    ),
  ).toBeVisible();

  //   // ensure email has been sent
  //   require("child_process").execSync(
  //     `npx env-cmd -f .env.test npm run start-pgboss-jobs-dev`,
  //   );

  //   await page.waitForTimeout(5000);

  //   // open maildev and click the first invitation link
  //   await page.goto("http://127.0.0.1:1080");
  //   await page.getByText("Connexion à l'espace membre BetaGouv").first().click();

  //   // get the magic link from the email preview
  //   const iframe = await page.frameLocator(".preview-iframe").first();
  //   await iframe.getByText("Me connecter", { exact: true }).click();
  //   const href =
  //     (await iframe
  //       .getByText("Me connecter", { exact: true })
  //       .getAttribute("href")) || "/";

  //   // open magic link
  //   await page.goto(href);
  //   await page.getByText("Me connecter").first().click();
  //   await page.waitForURL("/dashboard");
  //   await expect(
  //     page.getByText("Gérer mon compte", { exact: true }).first(),
  //   ).toBeVisible();
});

test("cannot create an existing member", async ({ page }) => {
  await createNewMember(page, {
    nom: "nouveauNom3",
    prenom: "nouveauPrenom3",
    startup: "Startup 2",
  });

  await expect(
    page.getByText("Erreur lors de la création de la fiche"),
  ).toBeVisible();

  await expect(
    page.getByText(
      "Un utilisateur avec le même nom \"nouveau-prenom3.nouveau-nom3\" existe déjà. Tu peux consulter sa fiche sur https://localhost/community/nouveau-prenom3.nouveau-nom3. S'il s'agit d'un homonyme, ajoute la première lettre du deuxième prenom de la personne à la suite de son prénom. Ex: Ophélie => Ophélie M.",
    ),
  ).toBeVisible();
});
