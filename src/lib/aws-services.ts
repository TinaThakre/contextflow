// AWS Services Integration for Voice DNA

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { VisualAnalysis } from '@/types/voice-dna';

// Initialize AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ==========================================
// Amazon Bedrock - Complete Visual Analysis
// ==========================================

export async function analyzeVisualContent(
  mediaUrl: string,
  caption?: string
): Promise<VisualAnalysis> {
  try {
    // Download image as base64
    const imageBase64 = await downloadImageAsBase64(mediaUrl);

    const prompt = `Analyze this image comprehensively and provide detailed insights:

${caption ? `Caption: "${caption}"` : ''}

Please provide a complete analysis with:
1. **Dominant Colors**: List 3-5 dominant colors as hex codes (e.g., ["#FF5733", "#3498DB"])
2. **Detected Objects**: List all significant objects, people, or items visible (e.g., ["person", "coffee cup", "laptop"])
3. **Scene Type**: Classify the scene (outdoor, indoor, urban, portrait, food, fitness, nature, etc.)
4. **Mood**: Overall emotional tone (happy, calm, energetic, professional, inspirational, etc.)
5. **Composition**: Describe the visual composition (centered, rule-of-thirds, minimalist, busy, bright, dark, etc.)
6. **Visual Themes**: Key visual themes or aesthetics (modern, vintage, minimalist, colorful, monochrome, etc.)
7. **Text in Image**: Any visible text, hashtags, or captions in the image
${caption ? '8. **Caption Alignment**: How well the image aligns with the provided caption' : ''}

Return ONLY valid JSON with this exact structure:
{
  "dominantColors": ["#hex1", "#hex2"],
  "detectedObjects": ["object1", "object2"],
  "sceneType": "scene_type",
  "mood": "mood_description",
  "composition": "composition_description",
  "visualThemes": ["theme1", "theme2"],
  "textInImage": ["text1", "text2"]
}`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1500,
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
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Parse the AI response
    const content = responseBody.content[0].text;
    const analysis = parseBedrockResponse(content);

    // Ensure all required fields are present
    return {
      dominantColors: analysis.dominantColors || [],
      detectedObjects: analysis.detectedObjects || [],
      sceneType: analysis.sceneType || 'general',
      mood: analysis.mood || 'neutral',
      composition: analysis.composition || 'standard',
      visualThemes: analysis.visualThemes || [],
      textInImage: analysis.textInImage || [],
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
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
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
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
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
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
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
// Helper Functions
// ==========================================

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

function parseBedrockResponse(content: string): Partial<VisualAnalysis> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: return defaults
    return {
      dominantColors: [],
      detectedObjects: [],
      sceneType: 'general',
      mood: 'neutral',
      composition: 'standard',
      visualThemes: [],
      textInImage: [],
    };
  } catch (error) {
    console.error('Failed to parse Bedrock response:', error);
    return {
      dominantColors: [],
      detectedObjects: [],
      sceneType: 'general',
      mood: 'neutral',
      composition: 'standard',
      visualThemes: [],
      textInImage: [],
    };
  }
}
