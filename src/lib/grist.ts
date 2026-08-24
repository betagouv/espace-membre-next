import config from "@/lib/config";

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

// Fetch records from a Grist table, optionally filtered.
// `filter` maps a column id to the accepted values, e.g. { ghid: ["jean.dupont"] }.
export async function getGristRecords(
  docId: string,
  tableId: string,
  filter?: Record<string, unknown[]>,
): Promise<{ id: number; fields: GristRecordFields }[]> {
  const query = filter
    ? `?filter=${encodeURIComponent(JSON.stringify(filter))}`
    : "";
  const url = gristApiUrl(`/docs/${docId}/tables/${tableId}/records${query}`);
  const response = await fetch(url, { headers: gristHeaders() });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grist getRecords a échoué (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    records: { id: number; fields: GristRecordFields }[];
  };
  return data.records;
}

// Upload files to a Grist document's attachment store.
// Returns the attachment ids, to be written into an Attachments column
// as ["L", ...ids].
export async function uploadGristAttachments(
  docId: string,
  files: File[],
): Promise<number[]> {
  if (files.length === 0) return [];

  const form = new FormData();
  for (const file of files) {
    form.append("upload", file, file.name);
  }

  const url = gristApiUrl(`/docs/${docId}/attachments`);
  const response = await fetch(url, {
    method: "POST",
    // Pas de Content-Type explicite : fetch pose lui-même la frontière
    // multipart, la fixer à la main casserait la requête.
    headers: gristHeaders(),
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Grist upload de pièce jointe a échoué (${response.status}): ${text}`,
    );
  }

  return (await response.json()) as number[];
}

// Stream one attachment out of a Grist document.
// Le magasin de pièces jointes est protégé par la clé d'API : le navigateur ne
// peut pas y accéder directement, il faut relayer.
export async function getGristAttachment(
  docId: string,
  attachmentId: number,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const url = gristApiUrl(
    `/docs/${docId}/attachments/${attachmentId}/download`,
  );
  const response = await fetch(url, { headers: gristHeaders() });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Grist téléchargement de pièce jointe a échoué (${response.status}): ${text}`,
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType:
      response.headers.get("content-type") || "application/octet-stream",
  };
}
