export type CronJob = {
  name: string;
  run: () => Promise<void>;
};

export async function runJobs(
  jobs: CronJob[],
  onError: (name: string, error: unknown) => void,
): Promise<{ failed: string[] }> {
  const failed: string[] = [];

  for (const job of jobs) {
    const start = Date.now();
    console.log(`[cron] ${job.name}: start`);
    try {
      await job.run();
      console.log(`[cron] ${job.name}: done in ${Date.now() - start}ms`);
    } catch (error) {
      console.error(
        `[cron] ${job.name}: failed after ${Date.now() - start}ms`,
        error,
      );
      failed.push(job.name);
      onError(job.name, error);
    }
  }

  return { failed };
}
