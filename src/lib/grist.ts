import config from "@/server/config";

// Minimal Grist REST API client.
// Docs: https://support.getgrist.com/api/

function gristApiUrl(path: string): string {
  const base = (
    config.GRIST_API_URL || "https://grist.numerique.gouv.fr/api"
  ).replace(/\/$/, "");
  return `${base}${path}`;
}

function gristHeaders(extra: Record<string, string> = {}): HeadersInit {
  if (!config.GRIST_API_KEY) {
    throw new Error("GRIST_API_KEY n'est pas configuré");
  }
  return {
    Authorization: `Bearer ${config.GRIST_API_KEY}`,
    ...extra,
  };
}

export type GristRecordFields = Record<string, unknown>;

// Add one or more records to a Grist table.
// Returns the ids of the created records.
export async function addGristRecords(
  docId: string,
  tableId: string,
  records: GristRecordFields[],
): Promise<number[]> {
  const url = gristApiUrl(`/docs/${docId}/tables/${tableId}/records`);
  const response = await fetch(url, {
    method: "POST",
    headers: gristHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      records: records.map((fields) => ({ fields })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grist addRecords a échoué (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { records: { id: number }[] };
  return data.records.map((r) => r.id);
}
