exports.up = function (knex) {
    return knex("users")
        .whereNull("primary_email")
        .select()
        .then((users) => {
            knex.transaction((trx) => {
                // @ts-ignore
                const queries = []; // Replace 'any' with a more specific type if possible
                users.forEach((user) => {
                    const query = knex("users")
                        .where("username", user.username)
                        .update({
                            primary_email: `${user.username}@${
                                process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr"
                            }`,
                        })
                        .transacting(trx); // This makes every update be in the same transaction
                    // @ts-ignore
                    queries.push(query);
                });
                return Promise.all(queries) // Once every query is written
                    .then(trx.commit) // We try to execute all of them
                    .catch(trx.rollback);
            });
        });
};

exports.down = function (knex) {
    return knex("users")
        .whereNotNull("primary_email")
        .then((users) => {
            knex.transaction((trx) => {
                // @ts-ignore
                const queries = []; // Replace 'any' with a more specific type if possible
                users.forEach((user) => {
                    const query = knex("users")
                        .where("username", user.username)
                        .update({
                            primary_email: null,
                        })
                        .transacting(trx); // This makes every update be in the same transaction
                    // @ts-ignore
                    queries.push(query);
                });
                Promise.all(queries) // Once every query is written
                    .then(trx.commit) // We try to execute all of them
                    .catch(trx.rollback);
            });
        });
};
