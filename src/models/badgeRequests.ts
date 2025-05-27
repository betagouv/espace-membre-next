import { z } from "zod";

export enum BADGE_REQUEST {
  BADGE_REQUEST_PENDING = "BADGE_REQUEST_PENDING",
  BADGE_REQUEST_SENT = "BADGE_REQUEST_SENT",
  BADGE_RENEWAL_REQUEST_PENDING = "BADGE_RENEWAL_REQUEST_PENDING",
  BADGE_RENEWAL_REQUEST_SENT = "BADGE_RENEWAL_REQUEST_SENT",
}

const badgeRequestSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(BADGE_REQUEST),
  start_date: z.date(),
  end_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
  request_id: z.string(),
  username: z.string(),
  dossier_number: z.number(),
  ds_token: z.string(),
});

export type badgeRequestSchemaType = z.infer<typeof badgeRequestSchema>;

export { badgeRequestSchema };
