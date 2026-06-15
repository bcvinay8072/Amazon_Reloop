const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

// Convert a readable stream to a Buffer
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fallback resale value by grade if the model omits it
const GRADE_RESALE_FACTOR = { Pristine: 0.85, Good: 0.60, Fair: 0.40, Poor: 0.20 };
// How much of resale value is recovered by restocking to main inventory (best when near-new)
const RESTOCK_FACTOR = { Pristine: 0.95, Good: 0.80, Fair: 0.55, Poor: 0.30 };
// Value uplift from refurbishment — depends on how much wear there is to fix
const REFURB_UPLIFT = { Pristine: 1.00, Good: 1.20, Fair: 1.40, Poor: 1.15 };

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { itemPrice, originLat, originLon, itemType, imageKeys } = body;

        const CUSTOMER_LAT = 13.6288;
        const CUSTOMER_LON = 79.4192;

        if (!itemPrice || !originLat || !originLon || !imageKeys || imageKeys.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: itemPrice, originLat, originLon, imageKeys" })
            };
        }

        // === FETCH IMAGES FROM S3 ===
        const imageContent = await Promise.all(
            imageKeys.slice(0, 5).map(async (key) => {
                const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
                const buffer = await streamToBuffer(obj.Body);
                return {
                    image: { format: "jpeg", source: { bytes: buffer } }
                };
            })
        );

        // === STEP 1: NOVA LITE — VISION GRADING ONLY ===
        // The model assesses condition; it does NOT decide routing.
        // This lets the deterministic engine use a CONDITION-ADJUSTED resale value.
        const prompt = `You are Amazon's Reverse Logistics Vision Engine. Inspect the product image(s) and grade the returned item's condition.

PRODUCT CONTEXT:
- Item Type: ${itemType}
- Original Retail Price: $${itemPrice}

Respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "productName": "Identified product name",
  "grade": "Pristine|Good|Fair|Poor",
  "confidenceScore": 85,
  "detectedIssues": ["specific visible issue", "..."],
  "transparencyPassport": "Honest 1-2 sentence condition description for a future buyer",
  "estimatedResalePrice": 0.00
}

GRADING GUIDE:
- Pristine: like-new, no visible wear → resale ~80-90% of original
- Good: minor wear, fully functional → resale ~55-65% of original
- Fair: noticeable wear/defects, still usable → resale ~35-45% of original
- Poor: significant damage → resale ~15-25% of original
estimatedResalePrice MUST reflect the actual visible condition and be consistent with the grade.`;

        const command = new ConverseCommand({
            modelId: "us.amazon.nova-lite-v1:0",
            messages: [{ role: "user", content: [...imageContent, { text: prompt }] }],
            inferenceConfig: { maxTokens: 700, temperature: 0.2 }
        });

        const bedrockResponse = await bedrock.send(command);
        let responseText = bedrockResponse.output.message.content[0].text.trim();
        responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        const nova = JSON.parse(responseText);

        const grade = ['Pristine', 'Good', 'Fair', 'Poor'].includes(nova.grade) ? nova.grade : 'Good';

        // Condition-adjusted resale value (the key fix): prefer the model's value,
        // fall back to a grade-based fraction of the original price.
        let resaleValue = Number(nova.estimatedResalePrice);
        if (!resaleValue || resaleValue <= 0) {
            resaleValue = itemPrice * (GRADE_RESALE_FACTOR[grade] || 0.5);
        }
        resaleValue = Number(resaleValue.toFixed(2));

        // === STEP 2: DETERMINISTIC NRV MATH (driven by condition-adjusted resale value) ===
        const distanceKm = calculateDistanceKm(CUSTOMER_LAT, CUSTOMER_LON, originLat, originLon);
        const warehouseLogisticsCost = Number((distanceKm * 0.05).toFixed(2));
        const refurbishLaborCost = 15.00;

        const issueNote = (nova.detectedIssues && nova.detectedIssues.length)
            ? ` Detected: ${nova.detectedIssues.slice(0, 2).join(', ')}.`
            : '';

        // === STEP 3: CONDITION-AWARE MARGINS + AUDITABLE ROUTING ===
        let margins, routingDecision, executiveReasoning;

        if (grade === 'Poor') {
            // Poor items fail the resale quality bar — resale channels are disqualified.
            margins = { warehouse: null, p2p: null, refurbish: null };
            routingDecision = 'DONATE_RECYCLE';
            executiveReasoning = `Graded Poor — fails Amazon's resale quality bar, so resale channels are disqualified. Donated/recycled to avoid landfill.${issueNote}`;
        } else {
            // Each channel's recovery value scales with the actual condition.
            const mP2P = Number((resaleValue * 0.90).toFixed(2));                                              // local sale, 10% fee, no shipping
            const mWarehouse = Number((resaleValue * RESTOCK_FACTOR[grade] - warehouseLogisticsCost).toFixed(2)); // restock to inventory, minus inbound logistics
            const mRefurbish = Number((resaleValue * REFURB_UPLIFT[grade] - refurbishLaborCost).toFixed(2));      // refurb uplift depends on fixable wear, minus labor

            margins = { warehouse: mWarehouse, p2p: mP2P, refurbish: mRefurbish };

            // Route to the channel with the highest net recovery — the winner is always the max shown.
            const candidates = [
                { route: 'RESTOCK_MAIN_WAREHOUSE', label: 'warehouse restock', margin: mWarehouse },
                { route: 'PEER_TO_PEER_RESALE', label: 'peer-to-peer resale', margin: mP2P },
                { route: 'AMAZON_RENEWED', label: 'refurbishment', margin: mRefurbish }
            ].sort((a, b) => b.margin - a.margin);

            const winner = candidates[0];
            const runnerUp = candidates[1];
            routingDecision = winner.route;
            executiveReasoning = `${grade} condition: ${winner.label} yields the highest net recovery ($${winner.margin.toFixed(2)}) versus ${runnerUp.label} ($${runnerUp.margin.toFixed(2)}).${issueNote}`;
        }

        const carbonMap = {
            'RESTOCK_MAIN_WAREHOUSE': 0.8,
            'PEER_TO_PEER_RESALE': 3.2,
            'AMAZON_RENEWED': 1.8,
            'DONATE_RECYCLE': 1.2
        };

        // === MERGE AND RETURN (schema unchanged for the frontend) ===
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                itemId: `nova-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                productName: nova.productName || "Unknown Product",
                grade,
                confidenceScore: nova.confidenceScore || 80,
                detectedIssues: nova.detectedIssues || [],
                transparencyPassport: nova.transparencyPassport || "",
                estimatedResalePrice: resaleValue,
                routingDecision,
                executiveReasoning,
                carbonSavedKg: carbonMap[routingDecision] || 2.0,
                margins: {
                    marginWarehouse: margins.warehouse,
                    marginP2P: margins.p2p,
                    marginRefurbish: margins.refurbish
                },
                logistics: { distanceKm: Math.round(distanceKm), warehouseLogisticsCost },
                evidenceImages: imageKeys,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error("Lambda error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
