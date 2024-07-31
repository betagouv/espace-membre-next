// pages/api/image/[username].js
import AWS from "aws-sdk";
// import { createCanvas } from "canvas";
import { NextResponse } from "next/server";

import config from "@/server/config";

const s3 = new AWS.S3({
    accessKeyId: config.S3_KEY_ID,
    secretAccessKey: config.S3_KEY_SECRET,
    region: "US",
    endpoint: new AWS.Endpoint(config.S3_HOST!),
    s3ForcePathStyle: true, // Needed for some S3-compatible storage services
});

// const generateImage = (username) => {
//     const canvas = createCanvas(200, 200);
//     const context = canvas.getContext("2d");

//     // Generate a random background color
//     const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
//     context.fillStyle = randomColor;
//     context.fillRect(0, 0, canvas.width, canvas.height);

//     // Draw the first letter of the username
//     context.fillStyle = "#FFFFFF";
//     context.font = "bold 100px Arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.fillText(
//         username.charAt(0).toUpperCase(),
//         canvas.width / 2,
//         canvas.height / 2
//     );

//     return canvas.toBuffer();
// };

export const dynamic = "force-dynamic";

export const GET = async (
    req: Request,
    { params: { username } }: { params: { username: string } }
) => {
    if (!username) {
        return Response.json({});
    }
    const s3Key = `members/${username}/avatar.jpg`;

    try {
        // Try to get the image from S3
        const s3Object = await s3
            .getObject({
                Bucket: config.S3_BUCKET!,
                Key: s3Key,
            })
            .promise();
        return new Response(s3Object.Body as Buffer, {
            // headers: {
            //     "Content-Type": s3Object.ContentType,
            //     "Cache-Control": "public, max-age=31536000", // Cache for 1 year
            // },
        });
    } catch (error) {
        // if (error.code === "NoSuchKey") {
        //     // If the image does not exist, generate a placeholder image
        //     const imageBuffer = generateImage(username);

        //     return new NextResponse(imageBuffer, {
        //         headers: {
        //             "Content-Type": "image/png",
        //         },
        //     });
        // } else {
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        // }
    }
};
