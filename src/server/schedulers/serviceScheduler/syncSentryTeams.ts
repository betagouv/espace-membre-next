import { db } from "@/lib/kysely";
import { SentryService } from "@/lib/sentry";
import { FakeSentryService } from "@/server/config/sentry.config";

export async function syncSentryTeams(
  sentryClient: SentryService | FakeSentryService,
) {
  try {
    // Fetch all Sentry teams
    const sentryTeams = await sentryClient.getAllTeams();

    // Insert or update each team in the database
    const sentryTeamsToInsert = sentryTeams.map((team) => ({
      sentry_id: team.id, // Assuming the Sentry team object has an `id`
      name: team.name, // Assuming the Sentry team object has a `name`
      slug: team.slug,
    }));
    if (sentryTeamsToInsert.length) {
      await db
        .insertInto("sentry_teams")
        .values(sentryTeamsToInsert)
        .onConflict((oc) =>
          oc
            .column("sentry_id") // Conflict key
            .doUpdateSet({
              name: (eb) => eb.ref("excluded.name"),
            }),
        )
        .execute();
    }

    console.log(
      `Successfully synced ${sentryTeams.length} Sentry teams to the database.`,
    );
  } catch (error) {
    console.error("Failed to sync Sentry teams:", error);
  }
}
