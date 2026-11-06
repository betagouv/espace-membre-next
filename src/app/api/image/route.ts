import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getFileName } from "./utils";
import { getImageContent, isS3Available } from "@/lib/s3";

const ImageParamsSchema = z.object({
  fileRelativeObjType: z.enum(["startup", "member", "incubator"]),
  fileIdentifier: z.enum(["shot", "hero", "avatar", "logo"]),
  fileObjIdentifier: z.string(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const { fileObjIdentifier, fileRelativeObjType, fileIdentifier } =
    ImageParamsSchema.parse({
      fileRelativeObjType: searchParams.get("fileRelativeObjType"),
      fileIdentifier: searchParams.get("fileIdentifier"),
      fileObjIdentifier: searchParams.get("fileObjIdentifier"),
    });
  if (!isS3Available()) {
    return Response.json(
      {
        error: "s3 is not defined",
      },
      {
        status: 500,
      },
    );
  }
  const s3Key = getFileName[fileRelativeObjType](
    fileObjIdentifier,
    fileIdentifier,
  );

  const s3Object = await getImageContent(s3Key);
  if (s3Object === undefined) {
    return new NextResponse(
      JSON.stringify({ error: "Image does not exist on s3" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
  return new NextResponse(new Uint8Array(s3Object));
}
