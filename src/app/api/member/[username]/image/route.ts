// pages/api/image/[username].js
import AWS from "aws-sdk";
// import { createCanvas } from "canvas";
import { NextResponse } from "next/server";

import config from "@/server/config";

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
    console.error("S3 is not defined");
}

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
        return new NextResponse(s3Object.Body as Buffer, {
            // headers: {
            //     "Content-Type": s3Object.ContentType,
            //     "Cache-Control": "public, max-age=31536000", // Cache for 1 year
            // },
        });
    } catch (error) {
        if ((error as { code: string }).code === "NoSuchKey") {
            // If the image does not exist, generate a placeholder image
            const imageBuffer =
                "data:image/png;base64,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jAD1l40MIFAugdBOCCas0IGVW2Iyh4AtAiHdEERYIQOyVSqygQAEPIFQjugtrFCBUFYIQMA2gRCu6CWsEAHYLhHZQQACqxPo64zOwup7MWWEAATKJNDHHZ2E1efCMktE1hCAQIgnrdbCQlY0HgQgEIJAF5e0ElaXC0IkxhkQgIBNAm2d0lhYbQ+2iZesIACB0ATauKWRsNocGDoZzoMABNIT+O+//9xvv/3mhoeHp12+bNkyNzQ05NZdd91pv+/XbrTRRrWB+nXrr7++W3vttaet/f777913333ndtxxx5V3+hj+/PNPN3/+/JVra4WFrGprwAIImCLw/PPPuyuvvNLtvvvu7qeffnI33XST23nnnd2FF17oPvroI/fvv/9W37vzzjurfz7llFPcdttt57755hv38MMPuz333HMGjz/++MMdffTRzkto4403dttvv3117o8//uiOP/74SmBff/21O/bYY6t7fAy33Xab22abbdw///zjnnjiCbf55pu7OYWFrEz1IclAoBGBY445xl133XVup512cldffbX7/fff3VFHHeUuuOAC9+GHH1Zn+O898sgj7pprrnEXX3yxO/jgg91zzz3n7r//fnfSSSe5F1980T399NPuzTffdHfddVe1xn//9ttvr57cvLS8rB588MHqn6+//nr3ww8/uK233tq9++67bv/993e//PJL9bR13nnnVb9/+eWXDxYWsmpUWxZBwCSBn3/+2d19993u5ptvdq+99pqbmJhw7733nrv33nurfI844ohKYldccYV7//333bbbbls9bR1yyCHVk9Yuu+xSfe+GG25wd9xxhzvssMOqfa+++moltb///tu98sor7rTTTnMHHXSQO+6449zk5KRba6213Msvv+xOP/109+mnn1bC8k9yH3/8cfX0NusTFrIy2YMkBYHGBLywvKyeeeaZSipeHJ9//nklD/916qmnugMOOMCdddZZ7osvvqiegLzU/JPRt99+695++2134IEHOv+05p+0pr5eeukl9/jjj7t33nnHffLJJ9XTk1/jPy76ry233NI99thj7txzz3VPPfWUGx0drZ7W/FPXQw89NFNYyKpxTVkIAXME/Psp/zHNP+H4p5033njDnXnmmdXTzS233FLJw38dfvjh7qqrrnIXXXSRu/XWW90ee+zhxsbG3LXXXlut8U9d++23nzv55JPdo48+Wn2U9C/r99prr2r/Pvvs484//3z35ZdfVh8P/cdNf/emm27q/Av4DTfc0HlpfvXVV1UM6623XvVua9oTFrIy138kBIHWBLx8brzxxuq91H333VfJx0vJvyj3H/eWLFnidtttt+pJygtqs802c5dcckn1nsqLxr+w998/55xz3KWXXuoWLlzo/vrrr+r9lX+ZPvUO7PXXX3fj4+PVOy4vpWeffbaS4gcffOB23XVXd88991Qv8w899NDqXdmRRx65Slj+rw79Zv8ItuZfZbbOmA0QgIBaAi+88EIlH/+eaYsttnAPPPBA9QR12WWXVRLxL8m9ZM4+++zqCWjfffetct1kk00q2fj1/mX7W2+95Z588snqScw/fZ1xxhnVRzv/dcIJJ1Ry8j+24IX02WefVb/2+/bee+/qKe3EE0+s1npx+rt32GEHt3TpUjc0MTEx6a2JrNT2GIFDICgB/+MH/m/tRkZGpp3r/2bP/wyW/xg39eV/7MB/VPMv3v3Hvrm+vGc22GCD6iPe6l/+aW2rrbZy66yzzsrf9j8K4T/1+fdjU5/+FixY4IbGxsYm/S/mzZsXNGkOgwAEIBCKgP+hVS+8/wFQekeutrHXqQAAAABJRU5ErkJggg=="; // generateImage(username);

            return new NextResponse(imageBuffer, {
                headers: {
                    "Content-Type": "image/png",
                },
            });
        } else {
            return new NextResponse(
                JSON.stringify({ error: "Internal Server Error" }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    }
};
