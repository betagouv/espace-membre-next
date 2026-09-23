import slugify from "@sindresorhus/slugify";

export async function up(knex) {
    // ghid est UNIQUE depuis migrations/20240418081201_add_table_incubator.js.
    // Le backfill doit donc dedupliquer, sinon deux incubateurs homonymes font
    // echouer la migration.
    const taken = new Set(
        (
            await knex("incubators")
                .select("ghid")
                .whereNotNull("ghid")
                .andWhere("ghid", "!=", "")
        ).map((r) => r.ghid),
    );

    const orphans = await knex("incubators")
        .select("uuid", "title")
        .whereRaw("ghid IS NULL OR ghid = ''");

    for (const row of orphans) {
        const base = slugify(row.title) || `incubateur-${row.uuid.slice(0, 8)}`;
        let candidate = base;
        let suffix = 2;
        while (taken.has(candidate)) {
            candidate = `${base}-${suffix++}`;
        }
        taken.add(candidate);
        await knex("incubators")
            .where("uuid", row.uuid)
            .update({ ghid: candidate });
    }

    await knex.raw(`ALTER TABLE incubators ALTER COLUMN ghid SET NOT NULL;`);
}

export async function down(knex) {
    await knex.raw(`ALTER TABLE incubators ALTER COLUMN ghid DROP NOT NULL;`);
}
