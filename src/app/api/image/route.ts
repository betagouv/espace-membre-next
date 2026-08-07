import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getFileName } from "./utils";
import s3 from "@/lib/s3";

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
  if (!s3) {
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

  try {
    const s3Object = await s3
      .getObject({
        Key: s3Key,
      })
      .promise();
    return new NextResponse(new Uint8Array(s3Object.Body as Buffer));
  } catch (error) {
    if ((error as { code: string }).code === "NoSuchKey") {
      return new NextResponse(
        JSON.stringify({ error: "Image does not exist on s3" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Internal Server Error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }
}
