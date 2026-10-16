const MAX_RETRIES = 5;

// exponential backoff : waits baseDelayMs, then twice as long at each attempt
export async function withRetry<T>(
  operation: () => Promise<T>,
  {
    retryLimit = MAX_RETRIES,
    operationName = "operation",
    baseDelayMs = 1000,
  }: { retryLimit?: number; operationName?: string; baseDelayMs?: number } = {},
): Promise<T> {
  const attempts = Math.max(1, Math.min(retryLimit, MAX_RETRIES));
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed for ${operationName}:`, error);
      if (attempt < attempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)),
        );
      }
    }
  }
  throw lastError;
}
