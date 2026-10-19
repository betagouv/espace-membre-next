import { expect } from "chai";
import proxyquire from "proxyquire";
import { addDays, subDays } from "date-fns";

import { generateApiKeyToken } from "@/lib/api-keys/token";
import { db } from "@/lib/kysely";
import { confirmApiKey } from "@/lib/kysely/queries/apiKeys";
import { SYSTEM_NAME } from "@/models/actionEvent/actionEvent";
import {
  resolveRecipients,
  revokeBlockedOwners,
  revokeMissingPerimeters,
  revokeUnused,
  sendReminders,
} from "@/server/queueing/workers/api-keys-maintenance";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [{ ghid: "maint-incub", title: "Maintenance Incubateur" }],
  startups: [],
  teams: [
    {
      ghid: "maint-team",
      name: "Equipe maintenance",
      incubator: "maint-incub",
    },
  ],
  users: [
    {
      username: "maint-lead",
      role: "Coach",
      teams: ["maint-team"],
      missions: [{ start: subDays(now, 30), end: addDays(now, 30) }],
    },
    {
      username: "maint-blocked",
      role: "Coach",
      missions: [{ start: subDays(now, 30), end: addDays(now, 30) }],
    },
  ],
};

type KeyOverrides = Partial<{
  owner_user_id: string;
  owner_incubator_id: string;
  kind: string;
  created_at: Date;
  last_used_at: Date | null;
  expires_at: Date | null;
  read_perimeter_kind: string;
  read_perimeter_id: string;
}>;

describe("api keys maintenance job", () => {
  const created: string[] = [];
  let leadUuid: string;
  let incubatorUuid: string;

  const insertKey = async (overrides: KeyOverrides = {}) => {
    const { tokenHash, tokenPrefix } = generateApiKeyToken();
    const row = await db
      .insertInto("api_keys")
      .values({
        kind: "service",
        name: "maintenance",
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        scopes: ["startups:read"],
        read_perimeter_kind: "global",
        created_by_user_id: leadUuid,
        ...overrides,
      })
      .returning(["uuid"])
      .executeTakeFirstOrThrow();
    created.push(row.uuid);
    return row.uuid;
  };

  const stateOf = (uuid: string) =>
    db
      .selectFrom("api_keys")
      .select(["revoked_at", "revoked_reason", "reminder_stage"])
      .where("uuid", "=", uuid)
      .executeTakeFirstOrThrow();

  before(async () => {
    await createData(testData);
    leadUuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", "maint-lead")
        .executeTakeFirstOrThrow()
    ).uuid;
    incubatorUuid = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "maint-incub")
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  after(async () => {
    // Suppression ciblee sur ce que ce fichier a cree : un deleteFrom sans
    // clause where sur api_keys et events emporterait les lignes des autres
    // fichiers, et ne tient aujourd'hui que par l'ordre alphabetique du glob.
    if (created.length) {
      await db.deleteFrom("api_keys").where("uuid", "in", created).execute();
      await db
        .deleteFrom("events")
        .where("created_by_username", "=", SYSTEM_NAME)
        .execute();
    }
    await deleteData(testData);
    delete process.env.API_KEYS_BLOCKED_USERS;
  });

  it("revokes personal keys of blocked owners and traces them", async () => {
    const blocked = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", "maint-blocked")
        .executeTakeFirstOrThrow()
    ).uuid;
    const uuid = await insertKey({ kind: "personal", owner_user_id: blocked });

    // Garde non cosmetique : un where(..., "in", []) genere un IN () invalide.
    process.env.API_KEYS_BLOCKED_USERS = "";
    expect(await revokeBlockedOwners()).to.equal(0);

    process.env.API_KEYS_BLOCKED_USERS = "maint-blocked";
    expect(await revokeBlockedOwners()).to.equal(1);
    delete process.env.API_KEYS_BLOCKED_USERS;

    const state = await stateOf(uuid);
    expect(state.revoked_at).to.not.be.null;
    expect(state.revoked_reason).to.equal("blocked_owner");
  });

  // Aucune clef etrangere sur les perimetres : c'est ce balayage qui rattrape.
  it("revokes keys whose perimeter target has disappeared", async () => {
    const doomed = await db
      .insertInto("incubators")
      .values({ title: "Doomed", ghid: "maint-doomed" })
      .returning("uuid")
      .executeTakeFirstOrThrow();
    const uuid = await insertKey({
      read_perimeter_kind: "incubator",
      read_perimeter_id: doomed.uuid,
    });

    expect(await revokeMissingPerimeters()).to.equal(0);

    await db.deleteFrom("incubators").where("uuid", "=", doomed.uuid).execute();
    expect(await revokeMissingPerimeters()).to.equal(1);
    expect((await stateOf(uuid)).revoked_reason).to.equal("perimeter_gone");
  });

  it("revokes a key unused for 180 days", async () => {
    const uuid = await insertKey({ last_used_at: subDays(now, 181) });
    const fresh = await insertKey({ last_used_at: subDays(now, 10) });

    expect(await revokeUnused()).to.equal(1);
    expect((await stateOf(uuid)).revoked_reason).to.equal("unused");
    expect((await stateOf(fresh)).revoked_at).to.be.null;
  });

  // Une clef jamais utilisee compte depuis sa creation.
  it("revokes a never-used key 180 days after its creation", async () => {
    const uuid = await insertKey({
      last_used_at: null,
      created_at: subDays(now, 181),
    });
    expect(await revokeUnused()).to.equal(1);
    expect((await stateOf(uuid)).revoked_reason).to.equal("unused");
  });

  it("sends the two reminders at J+90 and J+180, counted from created_at", async () => {
    const uuid = await insertKey({
      owner_incubator_id: incubatorUuid,
      created_at: subDays(now, 91),
      last_used_at: now,
    });

    expect(await sendReminders()).to.be.greaterThan(0);
    expect((await stateOf(uuid)).reminder_stage).to.equal(1);

    // Toujours au premier palier : pas de second rappel avant J+180.
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(1);

    await db
      .updateTable("api_keys")
      .set({ created_at: subDays(now, 181) })
      .where("uuid", "=", uuid)
      .execute();
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(2);
  });

  /**
   * Les deux paliers se comptent depuis max(created_at, confirmed_at). Sans
   * confirmed_at, remettre reminder_stage a 0 ne rendait rien : l'echeance
   * restait ancree sur created_at, donc une clef ancienne confirmee ce matin
   * reprenait ses DEUX rappels des l'execution suivante.
   */
  it("gives back two reminder stages, counted from the confirmation", async () => {
    const uuid = await insertKey({
      owner_incubator_id: incubatorUuid,
      created_at: subDays(now, 300),
      last_used_at: now,
    });

    // Les deux paliers de la periode de creation sont consommes.
    await sendReminders();
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(2);

    await confirmApiKey(uuid);
    const confirmed = await db
      .selectFrom("api_keys")
      .select(["confirmed_at", "reminder_stage"])
      .where("uuid", "=", uuid)
      .executeTakeFirstOrThrow();
    expect(confirmed.confirmed_at, "confirmed_at non ecrit").to.not.be.null;
    expect(confirmed.reminder_stage).to.equal(0);

    // Le compteur repart de la confirmation : rien n'est du le lendemain.
    await sendReminders();
    await sendReminders();
    expect(
      (await stateOf(uuid)).reminder_stage,
      "les deux rappels repartent immediatement apres la confirmation",
    ).to.equal(0);

    // Premier palier, J+90 apres la confirmation et non apres la creation.
    await db
      .updateTable("api_keys")
      .set({ confirmed_at: subDays(now, 91) })
      .where("uuid", "=", uuid)
      .execute();
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(1);
    await sendReminders();
    expect(
      (await stateOf(uuid)).reminder_stage,
      "second rappel avant J+180 depuis la confirmation",
    ).to.equal(1);

    // Second palier.
    await db
      .updateTable("api_keys")
      .set({ confirmed_at: subDays(now, 181) })
      .where("uuid", "=", uuid)
      .execute();
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(2);
  });

  // reminder_stage n'est lu par aucun code de revocation.
  it("never revokes a key because its reminders went unanswered", async () => {
    const uuid = await insertKey({
      owner_incubator_id: incubatorUuid,
      created_at: subDays(now, 100),
      last_used_at: now,
    });
    await sendReminders();
    await sendReminders();
    expect((await stateOf(uuid)).revoked_at, "rappel non lu = revocation").to.be
      .null;
  });

  it("never reminds a key that carries an expiration date", async () => {
    const uuid = await insertKey({
      owner_incubator_id: incubatorUuid,
      created_at: subDays(now, 200),
      last_used_at: now,
      expires_at: addDays(now, 30),
    });
    await sendReminders();
    expect((await stateOf(uuid)).reminder_stage).to.equal(0);
  });

  /**
   * ESPACE_MEMBRE_ADMIN porte des USERNAMES : sans resolution, le rappel d'une
   * clef d'organisation partait avec des destinataires qui ne sont pas des
   * adresses, et l'envoi echouait avant la mise a jour de reminder_stage.
   */
  it("resolves admin usernames into real addresses for an organisation key", async () => {
    // getAdmin() est vide en environnement de test et config.ESPACE_MEMBRE_ADMIN
    // est fige a l'import : on stubbe la source plutot que d'armer une variable
    // d'environnement qui ne sera jamais relue.
    const { resolveRecipients: resolveWithAdmins } = proxyquire(
      "@/server/queueing/workers/api-keys-maintenance",
      { "@/server/config/admin.config": { getAdmin: () => ["maint-lead"] } },
    ) as typeof import("@/server/queueing/workers/api-keys-maintenance");

    const recipients = await resolveWithAdmins({
      kind: "service",
      owner_user_id: null,
      owner_incubator_id: null,
    });

    expect(recipients, "aucun destinataire resolu").to.not.be.empty;
    for (const recipient of recipients) {
      expect(recipient, `destinataire sans @ : ${recipient}`).to.include("@");
      expect(recipient, "un username est parti comme adresse").to.not.equal(
        "maint-lead",
      );
    }
  });

  /**
   * Destinataires recalcules a chaque envoi, jamais figes : un membre retire de
   * l'equipe hier ne recoit pas le rappel de ce matin.
   */
  it("recomputes the recipients after a member leaves the team", async () => {
    const key = {
      kind: "service",
      owner_user_id: null,
      owner_incubator_id: incubatorUuid,
    };
    expect(await resolveRecipients(key)).to.have.length(1);

    await db
      .deleteFrom("users_teams")
      .where("user_id", "=", leadUuid)
      .execute();
    expect(await resolveRecipients(key)).to.have.length(0);
  });
});
