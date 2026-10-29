// Cucumber World + Playwright browser lifecycle.
//
// The World gives each scenario a fresh `page` and shares a single Chromium
// browser instance across the whole run. This is the minimal amount of wiring
// needed to use Playwright from Cucumber step definitions.
import {
  setWorldConstructor,
  Before,
  After,
  AfterAll,
} from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:8100";

export default class World {
  /** Browser shared across the whole run (launched once). */
  static browser: Browser;
  /** Playwright page for the current scenario. */
  page!: Page;

  /** Base URL of the app under test. */
  get appUrl(): string {
    return APP_URL;
  }

  async openPage(): Promise<void> {
    if (!World.browser) {
      World.browser = await chromium.launch();
    }
    this.page = await World.browser.newPage();
  }
}

setWorldConstructor(World);

Before(async function (this: World) {
  await this.openPage();
});

After(async function (this: World) {
  if (this.page) {
    await this.page.close();
  }
});

// Close the shared browser once all scenarios have run so the process can exit.
AfterAll(async function () {
  if (World.browser) {
    await World.browser.close();
  }
});
