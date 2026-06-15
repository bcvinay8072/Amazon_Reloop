/**
 * Seed script: loads mockReviews.json into the ProductReviews DynamoDB table.
 *
 * Usage:
 *   node seed-reviews.js
 *
 * Requires AWS credentials in environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION).
 */

const fs = require("fs");
const path = require("path");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_DEFAULT_REGION || "us-east-1";
const TABLE_NAME = process.env.REVIEWS_TABLE || "ProductReviews";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function seed() {
  // Read mockReviews.json from project root (one level up)
  const reviewsPath = path.resolve(__dirname, "..", "mockReviews.json");
  const reviews = JSON.parse(fs.readFileSync(reviewsPath, "utf-8"));

  console.log(`Loaded ${reviews.length} reviews. Seeding into "${TABLE_NAME}" (${REGION})...`);

  // DynamoDB BatchWrite handles max 25 items per request
  const chunkSize = 25;
  for (let i = 0; i < reviews.length; i += chunkSize) {
    const chunk = reviews.slice(i, i + chunkSize);
    const putRequests = chunk.map(r => ({
      PutRequest: {
        Item: {
          product_id: r.product_id,
          review_id: r.review_id,
          rating: r.rating,
          variant_purchased: r.variant_purchased,
          return_category: r.return_category,
          review_text: r.review_text
        }
      }
    }));

    await ddb.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: putRequests }
    }));

    console.log(`  Wrote ${Math.min(i + chunkSize, reviews.length)}/${reviews.length}`);
  }

  console.log("✅ Seeding complete.");
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
