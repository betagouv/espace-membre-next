import { S3, Endpoint } from "aws-sdk";

import config from "@/server/config";

// Configure AWS SDK
let s3;
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
    console.error("there is not s3");
}
export default s3;
