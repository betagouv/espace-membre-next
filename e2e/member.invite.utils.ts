export const createNewMember = async (page, { nom, prenom, startup }) => {
  await page.goto("/community");

  await page.getByText("Créer un membre").first().click();

  await page.waitForURL("/community/create");

  await page.getByLabel("Prénom (obligatoire)").fill(prenom);
  await page.getByLabel("Nom (obligatoire)", { exact: true }).fill(nom);
  await page
    .getByLabel("Email (obligatoire)")
    .fill(`${prenom}.${nom}@gmail.com`);
  await page
    .getByLabel("Entité qui gère la contractualisation (obligatoire)")
    .fill("Company");
  await page
    .getByLabel("Type de contrat (obligatoire)")
    .selectOption("Indépendant");

  await page.getByLabel("Produits concernés par la mission").fill(startup);
  await page.getByRole("option", { name: startup, exact: true }).click();

  await page.getByText("Créer la fiche").click();
};
