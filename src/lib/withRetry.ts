// Shared retry utility for email operations and other async tasks
// Provides exponential backoff retry logic matching the original pgboss retry behavior

const MAX_RETRIES = 5;

export async function withRetry<T>(
  operation: () => Promise<T>,
  retryLimit: number = MAX_RETRIES,
  operationName: string = "operation",
): Promise<T> {
  // Enforce max retry limit
  retryLimit = Math.min(retryLimit, MAX_RETRIES);

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed for ${operationName}:`, error);
      if (attempt < retryLimit) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  throw lastError || new Error(`${operationName} failed after ${retryLimit} attempts`);
}
