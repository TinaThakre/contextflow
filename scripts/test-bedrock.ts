// Test Bedrock Connection using Converse API

import { config } from 'dotenv';
import { resolve } from 'path';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

async function testBedrock() {
  console.log('🧪 Testing AWS Bedrock connection...\n');

  // Debug: Show what env vars are loaded
  console.log('🔍 Environment check:');
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`AWS_BEDROCK_REGION: ${process.env.AWS_BEDROCK_REGION || 'ap-south-1'}`);
  console.log(`AWS_BEDROCK_MODEL_ID: ${process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0'}\n`);

  // Verify env vars are loaded
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ ERROR: AWS credentials not found in .env file');
    console.error('Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set\n');
    process.exit(1);
  }

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_BEDROCK_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log('📡 Connecting to Bedrock using Converse API...');

    const command = new ConverseCommand({
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0',
      messages: [
        {
          role: 'user',
          content: [{ text: 'Say "Hello from Bedrock!" if you can read this.' }],
        },
      ],
      inferenceConfig: {
        maxTokens: 100,
      },
    });

    console.log('🚀 Sending test request...');
    const response = await client.send(command);

    console.log('✅ SUCCESS! Bedrock is working!\n');
    console.log('Response:', response.output?.message?.content?.[0]?.text || 'No response');
    console.log('\n🎉 Your Bedrock setup is complete and ready to use!\n');
  } catch (error: any) {
    console.error('❌ ERROR: Bedrock test failed\n');
    
    if (error.name === 'AccessDeniedException') {
      console.error('Access Denied: Your IAM user needs AmazonBedrockFullAccess policy');
      console.error('Go to IAM Console → Users → Your User → Add permissions\n');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('Model not found: The model might not be available in your region');
      console.error(`Current: ${process.env.AWS_BEDROCK_MODEL_ID}`);
      console.error(`Region: ${process.env.AWS_BEDROCK_REGION}\n`);
    } else if (error.name === 'ValidationException') {
      console.error('Invalid request: Check your model ID format');
      console.error(`Model: ${process.env.AWS_BEDROCK_MODEL_ID}`);
      console.error('\nTry using the full ARN or check available models in Bedrock console\n');
    } else {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    process.exit(1);
  }
}

testBedrock();
