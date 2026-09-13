import { NextResponse } from "next/server";

import { getImageContent } from "@/lib/s3";

export const revalidate = 3600; // 1 hour

export const GET = async (
  _: Request,
  segmentData: { params: Promise<{ username: string }> },
) => {
  const { username } = await segmentData.params;
  if (!username) {
    return Response.json({});
  }
  const s3Key = `members/${username}/avatar.jpg`;

  // Try to get the image from S3
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
};
