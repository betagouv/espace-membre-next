import { test, expect } from "@playwright/test";

test("Cannot fetch protected route", async ({ baseURL }) =>
    fetch(`${baseURL}/api/protected/startup`).then((r) => {
        expect(r.status).toBeGreaterThan(400);
    }));

test("Cannot fetch protected route with an invalid API token", async ({
    baseURL,
}) =>
    fetch(`${baseURL}/api/protected/startup`, {
        headers: { "X-Api-Key": "something" },
    }).then((r) => {
        expect(r.status).toBeGreaterThan(400);
    }));

test("Fetch protected route with an API token", async ({ baseURL }) =>
    fetch(`${baseURL}/api/protected/startup`, {
        headers: { "X-Api-Key": "test-api-key" },
    }).then((r) => {
        expect(r.status).toBe(200);
    }));
