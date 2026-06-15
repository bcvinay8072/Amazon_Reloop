const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const fileCount = Math.min(Math.max(parseInt(body.fileCount) || 1, 1), 5);

        // Generate a unique return session ID to group these images
        const sessionId = `return-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Create a pre-signed PUT URL for each image
        const uploads = [];
        for (let i = 0; i < fileCount; i++) {
            const key = `returns/${sessionId}/image-${i}.jpg`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                ContentType: "image/jpeg"
            });
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
            uploads.push({ key, uploadUrl });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sessionId, uploads })
        };
    } catch (error) {
        console.error("Pre-signed URL error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
