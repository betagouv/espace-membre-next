import { getAdmin } from "@config/admin.config";

export async function getCurrentUser(req, res) {
    return res.json({
        user: {
            name: req.auth && req.auth.id,
            isAdmin: req.auth ? getAdmin().includes(req.auth.id) : false,
        },
    });
}
