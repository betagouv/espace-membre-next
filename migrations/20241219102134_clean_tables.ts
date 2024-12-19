exports.up = async function (knex) {
    await knex.schema.dropTable("login_tokens");
    await knex.schema.dropTable("pull_requests");
    await knex.schema.dropTable("users_startups");
    await knex.schema.dropTable("user_details");
    await knex.schema.dropTable("visits");
};

exports.down = function (knex) {
    console.error("error, cannot restore tables !");
};
