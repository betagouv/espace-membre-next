import { checkUserIsExpired } from "@/lib/utils";

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

export function isOwnerExpired(
  userId: string,
  missions: { end: string | Date | null }[],
): boolean {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > now) return hit.value;

  // json_agg rend les timestamps en chaines : on remappe en Date pour ne pas
  // dependre de l'ordre lexicographique dans le reduce de checkUserIsExpired.
  const value = checkUserIsExpired(
    {
      missions: missions.map((m) => ({ end: m.end ? new Date(m.end) : null })),
    } as never,
    1,
  );

  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(userId, { value, expiresAt: now + TTL_MS });
  return value;
}
