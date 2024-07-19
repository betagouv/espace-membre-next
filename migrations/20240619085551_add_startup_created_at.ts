exports.up = async function (knex) {
    await knex.schema.alterTable("startups", function (table) {
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    });
    // this use the first known mission to update the newly added created_at field
    return knex.raw(`
WITH startup_phases as (
  SELECT st.uuid as startup_id,min(phases.start) as start  
  FROM startups st, phases
  WHERE st.uuid=phases.startup_id
  GROUP BY st.uuid
  ORDER BY st.uuid
)
UPDATE startups
SET created_at=COALESCE(startup_phases.start,'1970-1-1')
FROM startups st 
LEFT JOIN startup_phases
ON st.uuid=startup_phases.startup_id
WHERE startups.uuid=startup_phases.startup_id;
`);
};

exports.down = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.dropColumn("created_at");
    });
};
