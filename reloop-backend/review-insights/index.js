const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));

const REVIEWS_TABLE = process.env.REVIEWS_TABLE;

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
        const { productId, productName } = body;

        if (!productId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required field: productId" })
            };
        }

        // === STEP 1: Query reviews from DynamoDB ===
        const queryResult = await ddb.send(new QueryCommand({
            TableName: REVIEWS_TABLE,
            KeyConditionExpression: "product_id = :pid",
            ExpressionAttributeValues: { ":pid": productId }
        }));

        const reviews = queryResult.Items || [];

        if (reviews.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ warning: "No reviews available for this product yet." })
            };
        }

        // Focus on negative reviews (rating <= 3), limit to 12 for token efficiency
        const negativeReviews = reviews
            .filter(r => r.rating <= 3)
            .slice(0, 12)
            .map(r => r.review_text);

        const reviewText = negativeReviews.length > 0
            ? negativeReviews.join("\n")
            : reviews.slice(0, 8).map(r => r.review_text).join("\n");

        // === STEP 2: Summarize with Bedrock Nova Micro (text-only, fast & cheap) ===
        const prompt = `You analyze e-commerce product reviews to warn buyers about the #1 reason people return "${productName || productId}".

Negative reviews:
${reviewText}

In ONE concise sentence, state the most common return reason. Start with a percentage estimate (e.g., "About 80% of reviewers report..."). Be specific and helpful.`;

        const command = new ConverseCommand({
            modelId: "us.amazon.nova-micro-v1:0",
            messages: [{ role: "user", content: [{ text: prompt }] }],
            inferenceConfig: { maxTokens: 120, temperature: 0.3 }
        });

        const response = await bedrock.send(command);
        const warning = response.output.message.content[0].text.trim();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                warning,
                reviewCount: reviews.length,
                negativeCount: negativeReviews.length
            })
        };
    } catch (error) {
        console.error("Review insights error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
