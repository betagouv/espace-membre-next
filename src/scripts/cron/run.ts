import * as Sentry from "@sentry/node";

import { runJobs, type CronJob } from "@/scripts/runJobs";

Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });

function usage(slots: string[], jobs: string[]): never {
  console.error(
    `Usage: npm run cron -- <slot> | --job <name>\n` +
      `slots: ${slots.join(", ")}\njobs: ${jobs.join(", ")}`,
  );
  process.exit(1);
}

async function main(): Promise<number> {
  // Import dynamique : Sentry doit être initialisé avant le chargement des modules métier.
  const { CRON_SLOTS } = await import("./jobs");
  const slots = Object.keys(CRON_SLOTS);
  const allJobs: CronJob[] = Object.values(CRON_SLOTS).flat();

  const [arg, jobName] = process.argv.slice(2);
  let jobs: CronJob[] | undefined;
  if (arg === "--job") {
    const job = allJobs.find((j) => j.name === jobName);
    jobs = job && [job];
  } else if (arg && Object.hasOwn(CRON_SLOTS, arg)) {
    jobs = CRON_SLOTS[arg as keyof typeof CRON_SLOTS];
  }
  if (!jobs) {
    usage(
      slots,
      allJobs.map((j) => j.name),
    );
  }

  const { failed } = await runJobs(
    jobs.map((job) => ({
      name: job.name,
      run: () =>
        Sentry.withScope((scope) => {
          scope.setTag("cron_job", job.name);
          return job.run();
        }),
    })),
    (name, error) => {
      Sentry.withScope((scope) => {
        scope.setTag("cron_job", name);
        Sentry.captureException(error);
      });
    },
  );

  if (failed.length) {
    console.error(`[cron] failed jobs: ${failed.join(", ")}`);
  }
  return failed.length ? 1 : 0;
}

main()
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
    return 1;
  })
  .then(async (code) => {
    try {
      await Sentry.close(2000);
    } finally {
      process.exit(code);
    }
  });
