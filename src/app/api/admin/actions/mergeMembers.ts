"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/authorization/subject";
import { UnwrapPromise, withErrorHandling } from "@/lib/error";
import { mergeMembers } from "@/lib/members/mergeMembers";
import { routes } from "@/lib/routes";

const mergeInputSchema = z.object({
  keepUuid: z.string().uuid(),
  absorbedUuid: z.string().uuid(),
});

type MergeInput = z.infer<typeof mergeInputSchema>;

/** Exécute la fusion dans une transaction annulée : ce qui bougerait, rien de plus. */
async function previewMemberMerge(input: MergeInput) {
  const subject = await requireAdmin();
  const { keepUuid, absorbedUuid } = mergeInputSchema.parse(input);
  return mergeMembers({
    keepUuid,
    absorbedUuid,
    adminUsername: subject.username,
    dryRun: true,
  });
}

async function mergeMembersAction(input: MergeInput) {
  const subject = await requireAdmin();
  const { keepUuid, absorbedUuid } = mergeInputSchema.parse(input);
  const result = await mergeMembers({
    keepUuid,
    absorbedUuid,
    adminUsername: subject.username,
  });
  revalidatePath(routes.communityMember({ username: result.keep.username }));
  revalidatePath(
    routes.communityMember({ username: result.absorbed.username }),
  );
  revalidatePath(routes.community());
  return result;
}

export const safePreviewMemberMerge = withErrorHandling<
  UnwrapPromise<ReturnType<typeof previewMemberMerge>>,
  Parameters<typeof previewMemberMerge>
>(previewMemberMerge);

export const safeMergeMembers = withErrorHandling<
  UnwrapPromise<ReturnType<typeof mergeMembersAction>>,
  Parameters<typeof mergeMembersAction>
>(mergeMembersAction);
