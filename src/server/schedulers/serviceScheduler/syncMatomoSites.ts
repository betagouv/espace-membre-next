import { db } from "@/lib/kysely";
import { Matomo } from "@/lib/matomo";
import { FakeMatomo } from "@/server/config/matomo.config";

export async function syncMatomoSites(matomoClient: Matomo | FakeMatomo) {
    try {
        // Fetch all Matomo sites
        const matomoSites = await matomoClient.getAllSites();

        // Insert or update each site in the database
        const matomoSitesToInsert = matomoSites.map((site) => ({
            matomo_id: site.idsite, // Assuming the Matomo site object has an `id`
            name: site.name,
            url: site.main_url,
            type: site.type, // Assuming the Matomo site object has a `name`
        }));
        if (matomoSitesToInsert.length) {
            await db
                .insertInto("matomo_sites")
                .values(matomoSitesToInsert)
                .onConflict((oc) =>
                    oc
                        .column("matomo_id") // Conflict key
                        .doUpdateSet({
                            name: (eb) => eb.ref("excluded.name"),
                            url: (eb) => eb.ref("excluded.url"),
                        }),
                )
                .execute();
        }

        console.log(
            `Successfully synced ${matomoSites.length} Matomo sites to the database.`,
        );
    } catch (error) {
        console.error("Failed to sync Matomo sites:", error);
    }
}
