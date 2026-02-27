// AWS Services Integration for Voice DNA

import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { VisualAnalysis } from '@/types/voice-dna';

// Initialize AWS clients
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REKOGNITION_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ==========================================
// Amazon Rekognition - Image Analysis
// ==========================================

export async function analyzeImageWithRekognition(
  imageUrl: string
): Promise<Partial<VisualAnalysis>> {
  try {
    // Download image and upload to S3 temporarily
    const s3Key = await uploadImageToS3(imageUrl);

    // Detect labels (objects, scenes, concepts)
    const labelsCommand = new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Name: s3Key,
        },
      },
      MaxLabels: 20,
      MinConfidence: 70,
    });

    const labelsResponse = await rekognitionClient.send(labelsCommand);

    // Detect text in image
    const textCommand = new DetectTextCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Name: s3Key,
        },
      },
    });

    const textResponse = await rekognitionClient.send(textCommand);

    // Clean up S3
    await deleteFromS3(s3Key);

    // Extract dominant colors (simplified - Rekognition doesn't provide this directly)
    const dominantColors = extractColorsFromLabels(labelsResponse.Labels || []);

    return {
      detectedObjects: labelsResponse.Labels?.map((l) => l.Name || '') || [],
      sceneType: determineSceneType(labelsResponse.Labels || []),
      textInImage: textResponse.TextDetections?.map((t) => t.DetectedText || '') || [],
      dominantColors,
    };
  } catch (error) {
    console.error('Rekognition analysis error:', error);
    throw new Error('Failed to analyze image with Rekognition');
  }
}

// ==========================================
// Amazon Bedrock - Deep Content Analysis
// ==========================================

export async function analyzeImageWithBedrock(
  imageUrl: string,
  caption?: string
): Promise<Partial<VisualAnalysis>> {
  try {
    // Download image as base64
    const imageBase64 = await downloadImageAsBase64(imageUrl);

    const prompt = `Analyze this image and provide detailed insights:

${caption ? `Caption: ${caption}` : ''}

Please provide:
1. Dominant colors (hex codes)
2. Overall mood/emotion
3. Composition style (framing, perspective, lighting)
4. Visual themes
5. How well the image aligns with the caption (if provided)

Return as JSON with keys: dominantColors, mood, composition, visualThemes, captionAlignment`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Parse the AI response
    const content = responseBody.content[0].text;
    const analysis = parseBedrockResponse(content);

    return analysis;
  } catch (error) {
    console.error('Bedrock analysis error:', error);
    throw new Error('Failed to analyze image with Bedrock');
  }
}

// ==========================================
// Combined Visual Analysis
// ==========================================

export async function analyzeVisualContent(
  mediaUrl: string,
  caption?: string
): Promise<VisualAnalysis> {
  try {
    // Run both analyses in parallel
    const [rekognitionAnalysis, bedrockAnalysis] = await Promise.all([
      analyzeImageWithRekognition(mediaUrl),
      analyzeImageWithBedrock(mediaUrl, caption),
    ]);

    // Combine results
    return {
      dominantColors: bedrockAnalysis.dominantColors || [],
      detectedObjects: rekognitionAnalysis.detectedObjects || [],
      sceneType: rekognitionAnalysis.sceneType || 'unknown',
      mood: bedrockAnalysis.mood || 'neutral',
      composition: bedrockAnalysis.composition || 'standard',
      visualThemes: bedrockAnalysis.visualThemes || [],
      textInImage: rekognitionAnalysis.textInImage,
    };
  } catch (error) {
    console.error('Visual analysis error:', error);
    throw error;
  }
}

// ==========================================
// Text Analysis with Bedrock
// ==========================================

export async function analyzeTextWithBedrock(
  text: string,
  context?: string
): Promise<any> {
  try {
    const prompt = `Analyze this text for writing style and patterns:

Text: "${text}"
${context ? `Context: ${context}` : ''}

Provide analysis on:
1. Tone (casual, professional, humorous, inspirational, etc.)
2. Sentence structure (simple, moderate, complex)
3. Vocabulary level
4. Emotional range
5. Key themes and topics
6. Unique phrases or patterns

Return as JSON.`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return JSON.parse(responseBody.content[0].text);
  } catch (error) {
    console.error('Text analysis error:', error);
    throw new Error('Failed to analyze text with Bedrock');
  }
}

// ==========================================
// Voice DNA Synthesis with Bedrock
// ==========================================

export async function synthesizeVoiceDNA(
  posts: any[],
  textAnalysis: any,
  visualAnalysis: any,
  correlation: any,
  engagement: any
): Promise<any> {
  try {
    const prompt = `You are a Voice DNA synthesis expert. Analyze this user's content and create a comprehensive Voice DNA profile.

Data:
- Total Posts: ${posts.length}
- Text Analysis: ${JSON.stringify(textAnalysis, null, 2)}
- Visual Analysis: ${JSON.stringify(visualAnalysis, null, 2)}
- Content Correlation: ${JSON.stringify(correlation, null, 2)}
- Engagement Patterns: ${JSON.stringify(engagement, null, 2)}

Create a detailed Voice DNA profile with:
1. Core Identity (tone, personality, communication style)
2. Writing DNA (style profile, content structure, linguistic patterns)
3. Visual DNA (aesthetic profile, visual narrative)
4. Strategy DNA (hashtag formula, content formula, engagement drivers)
5. Behavioral DNA (posting behavior, evolution patterns)
6. Generation Templates (caption templates, hashtag sets, visual guidelines)

Return as structured JSON matching the VoiceDNA interface.`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return JSON.parse(responseBody.content[0].text);
  } catch (error) {
    console.error('Voice DNA synthesis error:', error);
    throw new Error('Failed to synthesize Voice DNA');
  }
}

// ==========================================
// Content Generation with Bedrock
// ==========================================

export async function generateContentWithBedrock(
  voiceDNA: any,
  context: string,
  contentType: 'caption' | 'hashtags' | 'full'
): Promise<any> {
  try {
    const prompt = `Generate ${contentType} based on this Voice DNA profile:

Voice DNA:
${JSON.stringify(voiceDNA, null, 2)}

Context: ${context}

Generate content that perfectly matches this user's voice, style, and patterns.
${contentType === 'caption' ? 'Generate only the caption text.' : ''}
${contentType === 'hashtags' ? 'Generate only hashtags as an array.' : ''}
${contentType === 'full' ? 'Generate both caption and hashtags.' : ''}

Return as JSON.`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return JSON.parse(responseBody.content[0].text);
  } catch (error) {
    console.error('Content generation error:', error);
    throw new Error('Failed to generate content');
  }
}

// ==========================================
// S3 Helper Functions
// ==========================================

async function uploadImageToS3(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    const key = `temp/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload image to S3');
  }
}

async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    // Don't throw - cleanup failure shouldn't break the flow
  }
}

async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('Image download error:', error);
    throw new Error('Failed to download image');
  }
}

// ==========================================
// Helper Functions
// ==========================================

function extractColorsFromLabels(labels: any[]): string[] {
  // Simplified color extraction based on labels
  const colorKeywords: { [key: string]: string } = {
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#00FF00',
    'Yellow': '#FFFF00',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Pink': '#FFC0CB',
    'Brown': '#A52A2A',
    'Black': '#000000',
    'White': '#FFFFFF',
    'Gray': '#808080',
  };

  const colors: string[] = [];
  
  for (const label of labels) {
    const name = label.Name || '';
    for (const [keyword, hex] of Object.entries(colorKeywords)) {
      if (name.includes(keyword) && !colors.includes(hex)) {
        colors.push(hex);
      }
    }
  }

  return colors.length > 0 ? colors : ['#808080']; // Default to gray
}

function determineSceneType(labels: any[]): string {
  const sceneKeywords: { [key: string]: string[] } = {
    'outdoor': ['Outdoors', 'Nature', 'Sky', 'Mountain', 'Beach', 'Forest'],
    'indoor': ['Indoors', 'Room', 'Furniture', 'Interior'],
    'urban': ['City', 'Building', 'Street', 'Urban'],
    'portrait': ['Person', 'Face', 'Portrait', 'Selfie'],
    'food': ['Food', 'Meal', 'Dish', 'Restaurant'],
    'fitness': ['Gym', 'Exercise', 'Fitness', 'Workout', 'Sport'],
  };

  const labelNames = labels.map((l) => l.Name || '');

  for (const [scene, keywords] of Object.entries(sceneKeywords)) {
    if (keywords.some((keyword) => labelNames.includes(keyword))) {
      return scene;
    }
  }

  return 'general';
}

function parseBedrockResponse(content: string): Partial<VisualAnalysis> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: parse manually
    return {
      dominantColors: [],
      mood: 'neutral',
      composition: 'standard',
      visualThemes: [],
    };
  } catch (error) {
    console.error('Failed to parse Bedrock response:', error);
    return {
      dominantColors: [],
      mood: 'neutral',
      composition: 'standard',
      visualThemes: [],
    };
  }
}
