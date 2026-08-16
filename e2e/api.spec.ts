import { test, expect } from "@playwright/test";

test("Rejects an API call without a token", async ({ baseURL }) =>
    fetch(`${baseURL}/api/v1/startups`).then(async (r) => {
        expect(r.status).toBe(401);
        expect(r.headers.get("content-type")).toContain(
            "application/problem+json",
        );
    }));

test("Rejects an API call with a malformed token", async ({ baseURL }) =>
    fetch(`${baseURL}/api/v1/startups`, {
        headers: { Authorization: "Bearer something" },
    }).then((r) => {
        expect(r.status).toBe(401);
    }));

test("Serves the OpenAPI document publicly", async ({ baseURL }) =>
    fetch(`${baseURL}/api/v1/openapi.json`).then(async (r) => {
        expect(r.status).toBe(200);
        const document = await r.json();
        expect(document.openapi).toBe("3.1.0");
    }));

test("Serves the documentation page publicly", async ({ baseURL }) =>
    fetch(`${baseURL}/api/v1/docs`).then((r) => {
        expect(r.status).toBe(200);
    }));
