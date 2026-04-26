import { test as setup, expect } from "@playwright/test";

const validMemberFile = "./playwright-auth-valid.member.json";

setup("authenticate as valid.member through magic link", async ({ page }) => {
  // fill login form
  await page.goto("/login");
  await page.getByLabel("Mon email").fill("valid.member@betagouv.ovh");
  await page.getByText("Recevoir le lien de connexion").click();

  await expect(
    page
      .getByText(
        "Un email avec un lien de connexion a été envoyé à ton adresse.",
      )
      .first(),
  ).toBeVisible();

  // open maildev and click the first invitation link
  await page.goto("http://127.0.0.1:1080");
  await page.getByText("Connexion à l'espace membre BetaGouv").first().click();

  // get the magic link from the email preview
  const iframe = page.frameLocator(".preview-iframe").first();
  const href =
    (await iframe
      .getByText("Me connecter", { exact: true })
      .getAttribute("href")) || "/";

  // open magic link
  await page.goto(href);
  //await page.waitForTimeout(2000);
  //await page.getByText("Me connecter").first().click();
  await expect(
    page.getByText("Gérer mon compte", { exact: true }).first(),
  ).toBeVisible();

  await page.context().storageState({ path: validMemberFile });
});
