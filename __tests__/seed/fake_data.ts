import { v4 as uuidv4 } from "uuid";

const ANOTHER_MEMBER_UUID = "13dd9fed-9c84-432c-a566-f785702147fc";

export async function seed(knex) {
  await populateUsers(knex);
  console.log("Populated users table with fake accounts");

  // Startups go first: deleting them cascades the incubator links, which would
  // otherwise block the incubators deletion.
  await knex("startups").delete();
  await knex("incubators").delete();

  const incubators = [
    { uuid: uuidv4(), title: "Incubateur test", ghid: "inc1" },
    { uuid: uuidv4(), title: "Incubateur test B", ghid: "inc2" },
  ];
  await knex("incubators").insert(incubators);
  const [incubator1, incubator2] = incubators;

  // The first incubator of each list is the derived primary one, mirroring what
  // the app does on write. The third startup is co-incubated on purpose, so the
  // multi-incubator case is testable straight out of the seed.
  const startups = [
    {
      uuid: uuidv4(),
      ghid: "startup-1",
      name: "Startup 1",
      incubators: [incubator1],
    },
    {
      uuid: uuidv4(),
      ghid: "startup-2",
      name: "Startup 2",
      incubators: [incubator1],
    },
    {
      uuid: uuidv4(),
      ghid: "startup-co-incubee",
      name: "Startup co-incubée",
      incubators: [incubator1, incubator2],
    },
  ];

  // startups_principal_incubator_linked is deferred, so a startup and its links
  // have to land in the same transaction.
  await knex.transaction(async (trx) => {
    await trx("startups").insert(
      startups.map(({ uuid, ghid, name, incubators: [primary] }) => ({
        uuid,
        ghid,
        name,
        incubator_id: primary.uuid,
      })),
    );
    await trx("startups_incubators").insert(
      startups.flatMap((startup) =>
        startup.incubators.map((incubator) => ({
          startup_id: startup.uuid,
          incubator_id: incubator.uuid,
        })),
      ),
    );
  });
  // Attach a member to the co-incubated startup, otherwise nobody belongs to any
  // startup and both the community search and the permission checks have nothing
  // to chew on. missions_startups cascades, so re-running the seed stays safe.
  const coIncubated = startups.find(
    (startup) => startup.incubators.length > 1,
  )!;
  const validMemberMission = await knex("missions")
    .join("users", "users.uuid", "missions.user_id")
    .where("users.username", "valid.member")
    .select("missions.uuid")
    .first();
  if (validMemberMission) {
    await knex("missions_startups").insert({
      mission_id: validMemberMission.uuid,
      startup_id: coIncubated.uuid,
    });
  }
  console.log("Inserted fake startups");

  // Equipe transverse de l'incubateur, avec un membre a mission active.
  // La creation d'une fiche membre envoie un email de validation a cette equipe
  // et echoue si personne ne peut la recevoir : sans elle, le parcours de
  // creation n'est pas testable. another.member (et non valid.member, qui joue
  // l'utilisateur connecte dans les tests) tient ce role.
  const teamId = uuidv4();
  await knex("teams").insert([
    {
      uuid: teamId,
      ghid: "team-1",
      name: "Equipe transverse",
      incubator_id: incubator1.uuid,
    },
  ]);
  await knex("users_teams").insert([
    {
      uuid: uuidv4(),
      user_id: ANOTHER_MEMBER_UUID,
      team_id: teamId,
    },
  ]);
  console.log("Inserted fake team");
}

const workplace_insee_codes = [
  "74236",
  "75056",
  "75119",
  "75111",
  "75118",
  "93051",
  "93051",
  "78368",
  "94043",
];

const populateUsers = async (knex) => {
  await knex("users").delete();
  await knex("missions").delete();
  const users = [
    {
      uuid: "53dd9fed-9c84-432c-a566-f785702147fc",
      username: "lucas.charrier",
      fullname: "Lucas Charrier",
      primary_email: "lucas.charrier@betagouv.ovh",
      domaine: "Autre",
      role: "Développement",
    },
    {
      uuid: "23dd9fed-9c84-432c-a566-f785702147fc",
      username: "valid.member",
      fullname: "Valid member",
      primary_email: "valid.member@betagouv.ovh",
      domaine: "Autre",
      role: "Développement",
    },
    {
      uuid: ANOTHER_MEMBER_UUID,
      username: "another.member",
      fullname: "Another member",
      primary_email: "another.member@betagouv.ovh",
      domaine: "Autre",
      role: "Coaching",
    },
    {
      uuid: "df843689-1eba-42d6-9f64-3806d8306cab",
      username: "expired.member",
      fullname: "Expired member",
      primary_email: "expired.member@betagouv.ovh",
      domaine: "Autre",
      role: "Développement",
    },
    {
      uuid: "ab843689-1eba-42d6-9f64-3806d8306cab",
      username: "empty.member",
      fullname: "Empty member",
      primary_email: "empty.member@betagouv.ovh",
      domaine: "Autre",
      role: "Développement",
    },
  ];
  // users.forEach(async (user) => {
  await knex("users").insert(
    users.map((user) => ({
      ...user,
      workplace_insee_code:
        workplace_insee_codes[
          Math.floor(Math.random() * workplace_insee_codes.length)
        ],
    })),
  );

  // add a valid mission for valid.member
  await knex("missions").insert({
    user_id: "23dd9fed-9c84-432c-a566-f785702147fc",
    start: new Date("2023-01-01"),
    end: new Date("2030-03-01"),
  });

  // add a valid mission for another.member
  await knex("missions").insert({
    user_id: ANOTHER_MEMBER_UUID,
    start: new Date("2023-05-01"),
    end: new Date("2030-07-01"),
  });

  // add an expired mission for expired.member
  await knex("missions").insert({
    user_id: "df843689-1eba-42d6-9f64-3806d8306cab",
    start: new Date("2023-01-01"),
    end: new Date("2023-03-01"),
  });
};
