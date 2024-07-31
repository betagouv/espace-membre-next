// pages/api/upload.ts
import AWS from "aws-sdk";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";

// Configure AWS SDK
let s3;
try {
    s3 = new AWS.S3({
        accessKeyId: config.S3_KEY_ID,
        secretAccessKey: config.S3_KEY_SECRET,
        region: "US",
        endpoint: new AWS.Endpoint(config.S3_HOST!),
        s3ForcePathStyle: true, // Needed for some S3-compatible storage services
    });
} catch {
    console.error("there is not s3");
}

const getFileName = {
    member: (username) => `members/${username}/avatar.jpg`,
    startupHero: (startupId) => `s3/startups/${startupId}/hero.jpg`,
    startupShot: (startupId) => `s3/startups/${startupId}/shot.jpg`,
};

export async function POST(req: NextRequest) {
    if (!s3) {
        return Response.json(
            {
                error: "s3 is not defined",
            },
            {
                status: 500,
            }
        );
    }
    const { fileName, fileType } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== fileName) {
        throw new Error(`You don't have the right to access this function`);
    }

    const s3Params = {
        Bucket: config.S3_BUCKET,
        Key: getFileName["member"](fileName),
        Expires: 60,
        ContentType: fileType,
    };

    try {
        const signedUrl = await s3.getSignedUrlPromise("putObject", s3Params);

        return Response.json({ signedUrl }, { status: 200 });
    } catch (error) {
        console.log("LCS ERRORS");
        return Response.json(
            {
                error: "Failed to generate signed URL",
            },
            {
                status: 500,
            }
        );
    }
}
