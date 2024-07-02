import { db } from "@/lib/kysely";

export async function getUsersLocation(req, res) {
    const users = await db
        .selectFrom("users")
        .select([
            "fullname",
            "primary_email",
            "workplace_insee_code",
            "osm_city",
            "username",
        ])
        .where("workplace_insee_code", "is not", null)
        .execute();
    res.json(
        users.map((u) => ({
            workplace_insee_code: u.workplace_insee_code,
            osm_city: u.osm_city,
            username: u.username,
        }))
    );
}

export async function getMap(req, res) {
    res.render("map", {
        activeTab: "map",
        currentUserId: req.auth.id,
        errors: [],
        messages: [],
        request: req,
    });
}
