// server/index.ts
import express from "express";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Define custom routes here, e.g., server.get('/my-route', (req, res) => { ... });

    // Default catch-all handler to allow Next.js to handle all other routes
    server.all("*", (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err?: any) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
