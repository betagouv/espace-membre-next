import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

// pages/api/upload.ts

import { getFileName } from "./utils";
import s3 from "@/lib/s3";
import { imagePostApiSchemaType } from "@/models/actions/image";
import { authOptions } from "@/utils/authoptions";

export async function DELETE(req: NextRequest) {
  const {
    fileIdentifier,
    fileRelativeObjType,
    fileObjIdentifier,
    revalidateMemberImage,
  } = (await req.json()) as imagePostApiSchemaType;
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.id !== fileObjIdentifier &&
      fileRelativeObjType === "member" &&
      !session.user.isAdmin)
  ) {
    throw new Error(`You don't have the right to access this function`);
  }

  if (!fileIdentifier) {
    return Response.json({ message: "Image key is required" }, { status: 400 });
  }

  const params = {
    Key: getFileName[fileRelativeObjType](fileObjIdentifier, fileIdentifier),
  };

  try {
    await s3.deleteObject(params).promise();
    return Response.json(
      { message: "Image deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return Response.json({ message: "Error deleting image" }, { status: 500 });
  } finally {
    if (revalidateMemberImage && fileRelativeObjType === "member") {
      revalidatePath(`/api/member/${fileObjIdentifier}/image`);
    }
  }
}

export async function POST(req: NextRequest) {
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
  const {
    fileObjIdentifier,
    fileRelativeObjType,
    fileType,
    fileIdentifier,
    revalidateMemberImage,
  } = (await req.json()) as imagePostApiSchemaType;

  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.id !== fileObjIdentifier &&
      fileRelativeObjType === "member" &&
      !session.user.isAdmin)
  ) {
    throw new Error(`You don't have the right to access this function`);
  }

  const s3Params = {
    Key: getFileName[fileRelativeObjType](fileObjIdentifier, fileIdentifier),
    Expires: 60,
    ContentType: fileType,
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise("putObject", s3Params);

    return Response.json({ signedUrl }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to generate signed URL",
      },
      {
        status: 500,
      },
    );
  } finally {
    if (revalidateMemberImage && fileRelativeObjType === "member") {
      revalidatePath(`/api/member/${fileObjIdentifier}/image`);
    }
  }
}

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
    // Try to get the image from S3
    const s3Object = await s3
      .getObject({
        Key: s3Key,
      })
      .promise();
    return new NextResponse(s3Object.Body as Buffer);
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
