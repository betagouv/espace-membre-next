import { NextResponse } from "next/server";

import s3 from "@/lib/s3";

export const revalidate = 3600; // 1 hour

export const GET = async (
  _: Request,
  { params }: { params: Promise<{ username: string }> },
) => {
  const { username } = await params;
  if (!username) {
    return Response.json({});
  }
  const s3Key = `members/${username}/avatar.jpg`;

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
};
