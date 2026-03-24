import { v4 as uuidv4 } from "uuid";

export async function seed(knex) {
  await populateUsers(knex);
  console.log("Populated users table with fake accounts");

  const incubId = uuidv4();
  await knex("incubators").insert([
    {
      uuid: incubId,
      title: "Incubateur test",
      ghid: "inc1",
    },
  ]);

  await knex("startups").insert([
    {
      uuid: uuidv4(),
      ghid: "startup-1",
      name: "Startup 1",
      incubator_id: incubId,
    },
    {
      uuid: uuidv4(),
      ghid: "startup-2",
      name: "Startup 2",
      incubator_id: incubId,
    },
  ]);
  console.log("Inserted fake startups");
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
      uuid: "13dd9fed-9c84-432c-a566-f785702147fc",
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
    user_id: "13dd9fed-9c84-432c-a566-f785702147fc",
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
