import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";
import { OPS_DEMANDE_TYPE, OPS_STATUT } from "@/models/ops";
import config from "@/server/config";
import { createData, deleteData } from "__tests__/utils/fakeData";

describe("submitOpsRequest", () => {
  const data = {
    incubators: [{ ghid: "ops-incubateur", title: "Incubateur OPS" }],
    startups: [
      {
        ghid: "ops-produit-membre",
        name: "Produit du membre",
        incubator: "ops-incubateur",
      },
      { ghid: "ops-autre-produit", name: "Autre produit" },
    ],
    users: [
      {
        username: "ops.membre",
        fullname: "Ops Membre",
        primary_email: "ops.membre@beta.gouv.fr",
        missions: [
          {
            start: new Date("2020-01-01"),
            end: new Date("2099-01-01"),
            startups: ["ops-produit-membre"],
          },
        ],
      },
    ],
  };
  const getServerSessionStub = sinon.stub();
  const addGristRecordsStub = sinon.stub();
  const { submitOpsRequest } = proxyquire("./actions", {
    "next-auth": { getServerSession: getServerSessionStub },
    // Le doc Grist du .env local est celui de la prod : rien ne doit y partir.
    "@/lib/grist": { addGristRecords: addGristRecordsStub },
  });
  let userUuid: string;
  let produitMembreId: string;
  let autreProduitId: string;

  const startupUuid = async (ghid: string) =>
    (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", ghid)
        .executeTakeFirstOrThrow()
    ).uuid;
  const asUser = (isAdmin = false) =>
    getServerSessionStub.resolves({
      user: { id: "ops.membre", uuid: userUuid, isAdmin },
    });
  const ligneGrist = () => addGristRecordsStub.firstCall.args[2][0];

  beforeEach(async () => {
    sinon.stub(config, "GRIST_API_KEY").value("test");
    sinon.stub(config, "GRIST_OPS_DOC_ID").value("doc-test");
    addGristRecordsStub.reset();
    addGristRecordsStub.resolves();
    await createData(data);
    userUuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", "ops.membre")
        .executeTakeFirstOrThrow()
    ).uuid;
    produitMembreId = await startupUuid("ops-produit-membre");
    autreProduitId = await startupUuid("ops-autre-produit");
    asUser();
  });

  afterEach(async () => {
    sinon.restore();
    await deleteData(data);
  });

  it("prend l'auteur et le statut côté serveur, pas dans le formulaire", async () => {
    const res = await submitOpsRequest({
      demande: OPS_DEMANDE_TYPE.AUTRE,
      commentaires: "Besoin d'aide",
      email: "pirate@example.com",
      tchapId: "@pirate:tchap.gouv.fr",
      prenomNom: "Pirate",
      statut: OPS_STATUT.TRAITE,
    });

    expect(res.success, res.message).to.be.true;
    expect(ligneGrist()).to.include({
      Email: "ops.membre@beta.gouv.fr",
      Tchap: "ops.membre",
      Prenom_Nom: "Ops Membre",
      Statut: OPS_STATUT.A_TRAITER,
    });
  });

  it("n'envoie que les champs de la ressource choisie", async () => {
    const res = await submitOpsRequest({
      demande: OPS_DEMANDE_TYPE.AUTRE,
      commentaires: "Besoin d'aide",
      // Restes d'une demande Scalingo puis Brevo abandonnées en route, et
      // emails pré-remplis pour toutes les ressources.
      nomApp: "vieille-app",
      zoneScalingo: "osc-fr1",
      startupId: produitMembreId,
      emailAssocier: "ops.membre@beta.gouv.fr",
      emailCollaborateur: "ops.membre@beta.gouv.fr",
      emailsNotifier: "ops.membre@beta.gouv.fr",
    });

    expect(res.success, res.message).to.be.true;
    expect(ligneGrist()).to.include({
      Notes: "Besoin d'aide",
      Nom_app: "",
      Zone_scalingo: "",
      Startup_id: "",
      Startup_name: "",
      Incubateur: "",
      Email_associer: "",
      Email_collaborateur: "",
      Emails_notifier: "",
    });
  });

  it("relit le produit en base plutôt que le nom envoyé", async () => {
    const res = await submitOpsRequest({
      demande: OPS_DEMANDE_TYPE.SENTRY,
      startupId: produitMembreId,
      startupName: "Nom inventé",
      emailAssocier: "ops.membre@beta.gouv.fr",
    });

    expect(res.success, res.message).to.be.true;
    expect(ligneGrist()).to.include({
      Startup_id: produitMembreId,
      Startup_name: "Produit du membre",
      Team_slug: "produit-du-membre",
      Incubateur: "Incubateur OPS",
      Email_associer: "ops.membre@beta.gouv.fr",
    });
  });

  it("refuse un produit dont le membre ne fait pas partie", async () => {
    const res = await submitOpsRequest({
      demande: OPS_DEMANDE_TYPE.SENTRY,
      startupId: autreProduitId,
      emailAssocier: "ops.membre@beta.gouv.fr",
    });

    expect(res.success).to.be.false;
    expect(addGristRecordsStub.called).to.be.false;
  });

  it("laisse un admin viser n'importe quel produit", async () => {
    asUser(true);
    const res = await submitOpsRequest({
      demande: OPS_DEMANDE_TYPE.BREVO,
      startupId: autreProduitId,
      emailAssocier: "ops.membre@beta.gouv.fr",
    });

    expect(res.success, res.message).to.be.true;
    expect(ligneGrist()).to.include({
      Startup_id: autreProduitId,
      Startup_name: "Autre produit",
      Incubateur: "",
      Team_slug: "",
    });
  });
});
