export const getArrayFromEnv = (
  key: string,
  defaultValue: string[] = [],
): string[] => {
  const value = process.env[key]?.trim();
  if (!value) {
    return defaultValue;
  }
  return value
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
};
