import { NextRequest } from "next/server";

// pages/api/upload.ts
import { getServerSession } from "next-auth/next";

import { getFileName } from "./utils";
import s3 from "@/lib/s3";
import { authOptions } from "@/utils/authoptions";

export async function DELETE(req: NextRequest) {
    const { fileName } = await req.json(); // The key of the image to be deleted

    if (!fileName) {
        return Response.json(
            { message: "Image key is required" },
            { status: 400 }
        );
    }

    const params = {
        Key: getFileName["member"](fileName),
    };

    try {
        await s3.deleteObject(params).promise();
        Response.json(
            { message: "Image deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting image:", error);
        Response.json({ message: "Error deleting image" }, { status: 500 });
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
            }
        );
    }
    const { fileName, fileType } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== fileName) {
        throw new Error(`You don't have the right to access this function`);
    }

    const s3Params = {
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
