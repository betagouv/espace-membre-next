import { S3, Endpoint } from "aws-sdk";
import fs from "fs";
import path from "path";

import config from "@/server/config";

// Configure AWS SDK
let s3;
if (process.env.NODE_ENV === "test" || process.env.CI) {
    const localS3Dir = path.join(__dirname, "mock-s3-files");
    if (!fs.existsSync(localS3Dir)) {
        fs.mkdirSync(localS3Dir);
    }

    const getSignedUrlPromise = function (
        method: string,
        params: { Key: string; Body: any }
    ) {
        const filePath = path.join(localS3Dir, params.Key);
        fs.writeFileSync(filePath, params.Body);
        return true;
    };
    const getObject = function (params: { Key: string }) {
        const filePath = path.join(localS3Dir, params.Key);
        const body = fs.readFileSync(filePath);
        return { promise: () => Promise.resolve({ Body: body }) };
    };

    const deleteObject = function (params: { Key: string }) {
        // delete file
    };
    s3 = {
        getSignedUrlPromise,
        getObject,
        deleteObject,
    };
} else {
    try {
        s3 = new S3({
            accessKeyId: config.S3_KEY_ID,
            secretAccessKey: config.S3_KEY_SECRET,
            region: config.S3_REGION,
            endpoint: new Endpoint(config.S3_HOST!),
            params: {
                Bucket: config.S3_BUCKET,
            },
        });
    } catch {
        console.error("there is no S3");
    }
}

export default s3;
