import db from ".";
import { DBStartup, createDBStartup } from "@/models/startup";

export const getDBStartup = (
    params: { uuid: string } | { id: string }
): Promise<DBStartup | undefined> => {
    return db("startups").where(params).first();
};

export const getAllStartups = (): Promise<DBStartup[]> => {
    return db("startups");
};

// Assuming knex is already configured and required

// Insert a new startup and link it to an organization within a transaction
export function createOrUpdateStartup(startupData: createDBStartup) {
    let { organization_ids, ...data } = startupData;
    return db
        .transaction((trx) => {
            // First, insert the new startup
            return trx
                .insert({
                    ...data,
                    phases: data.phases
                        ? JSON.stringify(data.phases)
                        : undefined,
                })
                .into("startups")
                .onConflict("id")
                .merge()
                .returning("*")
                .then(async ([startup]) => {
                    console.log("Inserted startup with ID:", startup.id);
                    organization_ids = organization_ids || [];
                    for (const organizationId of organization_ids) {
                        // Now, use the same transaction to link to an organization
                        await trx("startups_organizations")
                            .insert({
                                startup_id: startup.uuid,
                                organization_id: organizationId,
                            })
                            .onConflict(["startup_id", "organization_id"]) // Specify the conflict target columns
                            .ignore(); // Do nothing if conflict occurs
                    }
                    return [startup];
                })
                .then(trx.commit) // Commit the transaction if all operations succeed
                .catch(trx.rollback); // Rollback the transaction in case of an error
        })
        .then(() => {
            console.log(
                "Transaction complete: Startup and its link to organization have been saved."
            );
        })
        .catch((error) => {
            console.error("Transaction failed:", error);
        });
}
