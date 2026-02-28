// Test Bedrock Connection using Converse API

import { config } from "dotenv";
import { resolve } from "path";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Load environment variables from .env file
config({ path: resolve(process.cwd(), ".env") });

async function testBedrock() {
  console.log("🧪 Testing AWS Bedrock connection...\n");

  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_BEDROCK_REGION,
    AWS_BEDROCK_MODEL_ID,
  } = process.env;

  // Debug output
  console.log("🔍 Environment check:");
  console.log(
    `AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `AWS_BEDROCK_REGION: ${AWS_BEDROCK_REGION || "❌ Missing"}`
  );
  console.log(
    `AWS_BEDROCK_MODEL_ID: ${AWS_BEDROCK_MODEL_ID || "❌ Missing"}\n`
  );

  // Hard validation (no silent defaults)
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error("❌ ERROR: AWS credentials not found in .env file\n");
    process.exit(1);
  }

  if (!AWS_BEDROCK_REGION) {
    console.error("❌ ERROR: AWS_BEDROCK_REGION not set in .env\n");
    process.exit(1);
  }

  if (!AWS_BEDROCK_MODEL_ID) {
    console.error("❌ ERROR: AWS_BEDROCK_MODEL_ID not set in .env\n");
    process.exit(1);
  }

  const client = new BedrockRuntimeClient({
    region: AWS_BEDROCK_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log(`📡 Connecting to Bedrock in region: ${AWS_BEDROCK_REGION}`);
    console.log(`🤖 Using model: ${AWS_BEDROCK_MODEL_ID}\n`);

    const command = new ConverseCommand({
      modelId: AWS_BEDROCK_MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            { text: 'Say "Hello from Bedrock!" if you can read this.' },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 100,
      },
    });

    console.log("🚀 Sending test request...");
    const response = await client.send(command);

    const outputText =
      response.output?.message?.content?.[0]?.text ?? "No response";

    console.log("\n✅ SUCCESS! Bedrock is working!\n");
    console.log("Response:", outputText);
    console.log("\n🎉 Your Bedrock setup is complete and ready to use!\n");
  } catch (error: any) {
    console.error("\n❌ ERROR: Bedrock test failed\n");

    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.$metadata) {
      console.error("HTTP Status:", error.$metadata.httpStatusCode);
      console.error("Request ID:", error.$metadata.requestId);
    }

    process.exit(1);
  }
}

testBedrock();