import { test, expect } from "@playwright/test";

import { db } from "@/lib/kysely";

test.use({ storageState: "./playwright-auth-valid.member.json" });

const VALID_MEMBER_UUID = "23dd9fed-9c84-432c-a566-f785702147fc";
const FAR_FUTURE_END = new Date("2030-03-01");

test("onboarding panel is shown on dashboard for a recently created member with no upcoming departure", async ({
  page,
}) => {
  // valid.member is seeded with created_at = now() (>= 2025-01-01) and
  // mission end 2030 (not within 45 days), so onboarding should be visible
  await page.goto("/dashboard");
  await page.waitForURL("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Mon arrivée chez beta.gouv.fr" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Mon désembarquement" }),
  ).not.toBeVisible();
});

test("offboarding panel is shown on dashboard when mission expires within 45 days", async ({
  page,
}) => {
  // Set mission end date to 30 days from now to trigger offboarding panel
  const soonEnd = new Date();
  soonEnd.setDate(soonEnd.getDate() + 30);

  await db
    .updateTable("missions")
    .set({ end: soonEnd })
    .where("user_id", "=", VALID_MEMBER_UUID)
    .execute();

  try {
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Mon désembarquement" }),
    ).toBeVisible();

    // Onboarding panel is hidden when offboarding is active
    await expect(
      page.getByRole("heading", { name: "Mon arrivée chez beta.gouv.fr" }),
    ).not.toBeVisible();
  } finally {
    // Restore original mission end date
    await db
      .updateTable("missions")
      .set({ end: FAR_FUTURE_END })
      .where("user_id", "=", VALID_MEMBER_UUID)
      .execute();
  }
});

test("recent member expiring soon only sees offboarding panel, not onboarding", async ({
  page,
}) => {
  // Both conditions are true: recent member (created_at >= 2025) + mission ending soon.
  // The dashboard suppresses onboarding when offboarding is active, so only
  // the offboarding panel should appear.
  const soonEnd = new Date();
  soonEnd.setDate(soonEnd.getDate() + 30);

  await db
    .updateTable("users")
    .set({ created_at: new Date("2025-06-01") })
    .where("uuid", "=", VALID_MEMBER_UUID)
    .execute();

  await db
    .updateTable("missions")
    .set({ end: soonEnd })
    .where("user_id", "=", VALID_MEMBER_UUID)
    .execute();

  try {
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Mon désembarquement" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Mon arrivée chez beta.gouv.fr" }),
    ).not.toBeVisible();
  } finally {
    await db
      .updateTable("users")
      .set({ created_at: new Date("2025-06-01") })
      .where("uuid", "=", VALID_MEMBER_UUID)
      .execute();
    await db
      .updateTable("missions")
      .set({ end: FAR_FUTURE_END })
      .where("user_id", "=", VALID_MEMBER_UUID)
      .execute();
  }
});

test("checking an onboarding item increases the progress bar on account and dashboard", async ({
  page,
}) => {
  // Start from a blank slate so the initial progress is predictable
  await db
    .deleteFrom("user_events")
    .where("user_id", "=", VALID_MEMBER_UUID)
    .execute();

  try {
    // Open the embarquement tab directly via URL param.
    // The tab is null on first render and set by useEffect, so wait for
    // the checklist intro text before interacting.
    await page.goto("/account?tab=embarquement");
    await page.waitForURL(/\/account/);
    await expect(page.getByText("Bienvenue dans la communauté")).toBeVisible();

    // DSFR Tabs renders all panels in the DOM simultaneously; scope to the
    // active panel via .fr-tabs__panel--selected to avoid strict-mode errors.
    const activePanel = page.locator(".fr-tabs__panel--selected");

    // Read the initial progress percentage shown in the progress bar
    const progressText = activePanel.getByText(/^\d+%$/);
    const initialProgressStr = await progressText.textContent();
    const initialProgress = parseInt(initialProgressStr ?? "0");

    // Click the first enabled (non-disabled) checkbox — the first item
    // "onboarding-fiche-membre" is disabled+defaultChecked, so the first
    // enabled one is the next actual task
    // const checkbox = await activePanel.locator(
    //   "checkbox:not([disabled]) + label",
    // );
    await page.check("input[type=checkbox]:not([disabled]) + label");

    // Progress bar should update immediately in client state
    await expect(progressText).not.toHaveText(initialProgressStr!);
    const accountProgress = parseInt((await progressText.textContent()) ?? "0");
    expect(accountProgress).toBeGreaterThan(initialProgress);

    // Wait for the server action to persist the event before navigating
    await page.waitForLoadState("networkidle");

    // Dashboard should now reflect the saved progress
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Mon arrivée chez beta.gouv.fr" }),
    ).toBeVisible();

    const dashboardProgressStr = await page
      .locator("div")
      .filter({
        has: page.getByRole("heading", {
          name: "Mon arrivée chez beta.gouv.fr",
        }),
      })
      .getByText(/^\d+%$/)
      .textContent();
    expect(parseInt(dashboardProgressStr ?? "0")).toBeGreaterThan(
      initialProgress,
    );
  } finally {
    await db
      .deleteFrom("user_events")
      .where("user_id", "=", VALID_MEMBER_UUID)
      .execute();
  }
});

test("checking an offboarding item increases the progress bar on account and dashboard", async ({
  page,
}) => {
  const soonEnd = new Date();
  soonEnd.setDate(soonEnd.getDate() + 30);

  await db
    .updateTable("missions")
    .set({ end: soonEnd })
    .where("user_id", "=", VALID_MEMBER_UUID)
    .execute();

  await db
    .deleteFrom("user_events")
    .where("user_id", "=", VALID_MEMBER_UUID)
    .execute();

  try {
    await page.goto("/account?tab=desembarquement");
    await page.waitForURL(/\/account/);
    await expect(
      page.getByText("Lorque viendra le moment de quitter la communauté"),
    ).toBeVisible();

    // Scope to the active panel to avoid matching the onboarding panel's
    // progress bar which is also present in the DOM but hidden.
    const activePanel = page.locator(".fr-tabs__panel--selected");

    const progressText = activePanel.getByText(/^\d+%$/);
    const initialProgressStr = await progressText.textContent();
    const initialProgress = parseInt(initialProgressStr ?? "0");

    // Check the first enabled checkbox in the offboarding list

    await page.waitForTimeout(500);
    await page.check("input[type=checkbox]:not([disabled]) + label");

    await expect(progressText).not.toHaveText(initialProgressStr!);
    const accountProgress = parseInt((await progressText.textContent()) ?? "0");
    expect(accountProgress).toBeGreaterThan(initialProgress);

    await page.waitForLoadState("networkidle");

    // Dashboard offboarding panel should reflect the updated progress
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Mon désembarquement" }),
    ).toBeVisible();

    const dashboardProgressStr = await page
      .locator("div")
      .filter({
        has: page.getByRole("heading", { name: "Mon désembarquement" }),
      })
      .getByText(/^\d+%$/)
      .textContent();
    expect(parseInt(dashboardProgressStr ?? "0")).toBeGreaterThan(
      initialProgress,
    );
  } finally {
    await db
      .updateTable("missions")
      .set({ end: FAR_FUTURE_END })
      .where("user_id", "=", VALID_MEMBER_UUID)
      .execute();
    await db
      .deleteFrom("user_events")
      .where("user_id", "=", VALID_MEMBER_UUID)
      .execute();
  }
});

test("onboarding panel is not shown for a member created before 2025", async ({
  page,
}) => {
  // Simulate an old member by setting created_at before 2025
  await db
    .updateTable("users")
    .set({ created_at: new Date("2024-01-01") })
    .where("uuid", "=", VALID_MEMBER_UUID)
    .execute();

  try {
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Mon arrivée chez beta.gouv.fr" }),
    ).not.toBeVisible();
  } finally {
    // Restore created_at to a recent date
    await db
      .updateTable("users")
      .set({ created_at: new Date("2025-06-01") })
      .where("uuid", "=", VALID_MEMBER_UUID)
      .execute();
  }
});
