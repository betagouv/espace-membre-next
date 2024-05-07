export async function up(knex) {
    await knex("users").whereNull("domaine").update({
        domaine: "Autre",
    });
    await knex("users").where("domaine", "=", "").update({
        domaine: "Autre",
    });
    return knex.schema.table("users", function (table) {
        table
            .enu(
                "domaine",
                [
                    "Animation",
                    "Coaching",
                    "Déploiement",
                    "Design",
                    "Développement",
                    "Intraprenariat",
                    "Produit",
                    "Autre",
                    "Data",
                ],
                {
                    useNative: true,
                    enumName: "users_domaine_enum",
                }
            )
            .notNullable()
            .alter();
    });
}

export async function down(knex) {
    await knex.schema.table("users", function (table) {
        table.string("domaine").notNullable().alter();
    });
    return knex.raw("DROP TYPE IF EXISTS users_domaine_enum");
}
