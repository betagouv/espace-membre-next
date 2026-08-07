"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { getFileName } from "@/app/api/image/utils";
import s3 from "@/lib/s3";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";

const getSignedUrlSchema = z.object({
  fileObjIdentifier: z.string(),
  fileRelativeObjType: z.enum(["startup", "member", "incubator"]),
  fileType: z.string(),
  fileIdentifier: z.enum(["shot", "hero", "avatar", "logo"]),
  revalidateMemberImage: z.boolean().optional(),
});

const deleteImageSchema = z.object({
  fileObjIdentifier: z.string(),
  fileRelativeObjType: z.enum(["startup", "member", "incubator"]),
  fileIdentifier: z.enum(["shot", "hero", "avatar", "logo"]),
  revalidateMemberImage: z.boolean().optional(),
});

async function getSignedUrlAction(input: z.infer<typeof getSignedUrlSchema>) {
  const params = getSignedUrlSchema.parse(input);
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.id !== params.fileObjIdentifier &&
      params.fileRelativeObjType === "member" &&
      !session.user.isAdmin)
  ) {
    throw new AuthorizationError();
  }
  if (!s3) {
    throw new BusinessError(
      "serviceUnavailable",
      "Le service de stockage d'images est momentanément indisponible.",
    );
  }

  const s3Params = {
    Key: getFileName[params.fileRelativeObjType](
      params.fileObjIdentifier,
      params.fileIdentifier,
    ),
    Expires: 60,
    ContentType: params.fileType,
  };
  const signedUrl = await s3.getSignedUrlPromise("putObject", s3Params);

  if (params.revalidateMemberImage && params.fileRelativeObjType === "member") {
    revalidatePath(`/api/member/${params.fileObjIdentifier}/image`);
  }

  return { signedUrl };
}

async function deleteImageAction(
  input: z.infer<typeof deleteImageSchema>,
) {
  const params = deleteImageSchema.parse(input);
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.id !== params.fileObjIdentifier &&
      params.fileRelativeObjType === "member" &&
      !session.user.isAdmin)
  ) {
    throw new AuthorizationError();
  }

  await s3
    .deleteObject({
      Key: getFileName[params.fileRelativeObjType](
        params.fileObjIdentifier,
        params.fileIdentifier,
      ),
    })
    .promise();

  if (params.revalidateMemberImage && params.fileRelativeObjType === "member") {
    revalidatePath(`/api/member/${params.fileObjIdentifier}/image`);
  }

  return { message: "Image deleted successfully" };
}

export const getSignedUrl = withErrorHandling(getSignedUrlAction);
export const deleteImage = withErrorHandling(deleteImageAction);
