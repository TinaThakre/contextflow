/**
 * AWS Bedrock Integration — Converse API
 *
 * All Claude interactions go through ConverseCommand (not InvokeModel).
 * This provides a unified, SDK-native interface with automatic token counting,
 * built-in retry semantics, and support for multi-modal content blocks.
 *
 * Environment variables:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_BEDROCK_REGION   (default: us-east-1)
 *   AWS_BEDROCK_MODEL_ID (default: us.anthropic.claude-3-5-haiku-20241022-v1:0)
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type SystemContentBlock,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import type { ParsedInstagramPost } from './instagram-parser';

// ─── Client Singleton ────────────────────────────────────────────

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MODEL_ID =
  process.env.AWS_BEDROCK_MODEL_ID ||
  'us.anthropic.claude-3-5-haiku-20241022-v1:0';

// ─── Generic Converse Helper ─────────────────────────────────────

interface ConverseOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

async function converse(opts: ConverseOptions): Promise<string> {
  const system: SystemContentBlock[] = [{ text: opts.systemPrompt }];

  const messages: Message[] = [
    {
      role: 'user',
      content: [{ text: opts.userMessage }] as ContentBlock[],
    },
  ];

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system,
    messages,
    inferenceConfig: {
      maxTokens: opts.maxTokens ?? 4096,
    },
  });

  const response = await bedrockClient.send(command);
  const outputBlock = response.output?.message?.content?.[0];

  if (!outputBlock || !('text' in outputBlock) || !outputBlock.text) {
    throw new Error('Bedrock returned empty response');
  }

  return outputBlock.text;
}

/** Parse JSON from a Bedrock response, tolerating markdown fences. */
function parseJsonResponse<T = any>(raw: string): T {
  // Strip optional ```json ... ``` wrapping
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Find first { or [ and last } or ]
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  const start =
    startObj === -1
      ? startArr
      : startArr === -1
        ? startObj
        : Math.min(startObj, startArr);

  if (start === -1) throw new Error('No JSON found in response');

  const isArray = cleaned[start] === '[';
  const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
  if (end === -1) throw new Error('Malformed JSON in response');

  return JSON.parse(cleaned.slice(start, end + 1));
}

// ─── Voice DNA Generation ────────────────────────────────────────

const VOICE_DNA_SYSTEM_PROMPT = `You are Voice DNA Analyst, an expert system that builds a comprehensive digital identity fingerprint from social media content.

TASK:
Analyze the provided Instagram posts (captions, hashtags, engagement metrics, media metadata) and produce a structured Voice DNA profile.

ANALYSIS DIMENSIONS:
1. Core Identity — dominant tone, personality traits, communication style, content pillars, unique signature elements
2. Writing DNA — sentence rhythm, vocabulary level, emotional range, content structure patterns, linguistic fingerprint
3. Visual DNA — aesthetic profile (inferred from media types, caption context, emoji usage), visual narrative style
4. Strategy DNA — hashtag formula, winning content combinations, engagement drivers
5. Behavioral DNA — posting cadence, consistency, evolution over time
6. Generation Templates — reusable caption templates, hashtag presets, visual guidelines

RULES:
• Base EVERY claim on evidence from the provided posts.
• Confidence scores (0–1) must reflect actual data coverage.
• Return ONLY valid JSON — no markdown, no commentary, no prose.
• The JSON MUST conform to the VoiceDNA schema provided below.`;

const VOICE_DNA_SCHEMA_HINT = `
Expected JSON root shape:
{
  "coreIdentity": {
    "primaryVoice": { "tone": string, "personality": string[], "communicationStyle": string },
    "contentPillars": [{ "pillar": string, "weight": number, "keywords": string[] }],
    "uniqueSignature": { "catchphrases": string[], "writingQuirks": string[], "visualSignature": string }
  },
  "writingDNA": {
    "styleProfile": { "sentenceRhythm": string, "vocabularyLevel": string, "emotionalRange": string[], "punctuationPersonality": string },
    "contentStructure": { "openingStyle": string, "bodyStructure": string, "closingStyle": string, "ctaPattern": string },
    "linguisticPatterns": { "favoriteWords": string[], "phraseTemplates": string[], "metaphorStyle": string, "storytellingApproach": string }
  },
  "visualDNA": {
    "aestheticProfile": {
      "colorIdentity": { "palette": string[], "mood": string, "consistency": number },
      "compositionStyle": { "framing": string, "perspective": string, "lighting": string },
      "contentMix": { "primaryType": string, "secondaryTypes": string[], "variety": number }
    },
    "visualNarrative": { "storyTelling": string, "emotionalImpact": string, "brandingElements": string[] }
  },
  "strategyDNA": {
    "hashtagFormula": { "optimalCount": number, "categoryMix": string[], "effectivePatterns": [{ "context": string, "hashtags": string[], "expectedEngagement": number }] },
    "contentFormula": { "winningCombinations": [{ "visualStyle": string, "captionApproach": string, "hashtags": string[], "timing": string, "expectedPerformance": number }] },
    "engagementDrivers": { "topTriggers": string[], "audiencePreferences": string[], "contentGaps": string[] }
  },
  "behavioralDNA": {
    "postingBehavior": { "frequency": string, "consistency": number, "optimalTiming": string[] },
    "evolutionPattern": { "contentEvolution": string, "styleShifts": [{ "period": string, "change": string }] }
  },
  "generationTemplates": {
    "captionTemplates": [{ "template": string, "context": string, "variables": string[], "exampleOutput": string }],
    "hashtagSets": [{ "name": string, "tags": string[], "useCase": string }],
    "visualGuidelines": { "colorSchemes": string[][], "compositionRules": string[], "contentTypes": string[] }
  }
}`;

export interface VoiceDNAResult {
  coreIdentity: any;
  writingDNA: any;
  visualDNA: any;
  strategyDNA: any;
  behavioralDNA: any;
  generationTemplates: any;
}

/**
 * Generate a full Voice DNA profile from parsed Instagram posts.
 *
 * Sends all post data to Claude in a single Converse call
 * to produce a holistic analysis.
 */
export async function generateVoiceDNA(
  posts: ParsedInstagramPost[],
): Promise<VoiceDNAResult> {
  // Build a compact representation to fit within context window
  const postSummaries = posts.map((p, i) => ({
    idx: i + 1,
    caption: p.caption,
    hashtags: p.hashtags,
    mediaType: p.mediaType,
    likes: p.likeCount,
    comments: p.commentCount,
    timestamp: new Date(p.timestamp * 1000).toISOString(),
    hasCarousel: !!p.carouselMedia?.length,
    carouselCount: p.carouselMedia?.length ?? 0,
  }));

  const userMessage = `Analyze the following ${posts.length} Instagram posts and generate the Voice DNA JSON.

${VOICE_DNA_SCHEMA_HINT}

--- POSTS DATA ---
${JSON.stringify(postSummaries, null, 2)}
--- END POSTS DATA ---

Return the Voice DNA JSON now.`;

  const raw = await converse({
    systemPrompt: VOICE_DNA_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4096,
  });

  return parseJsonResponse<VoiceDNAResult>(raw);
}

// ─── Content Generation ──────────────────────────────────────────

const CONTENT_GEN_SYSTEM_PROMPT = `You are a social media content ghostwriter. You replicate a creator's exact voice, tone, style and hashtag strategy based on their Voice DNA profile.

RULES:
• Match the creator's vocabulary, sentence structure, emoji usage, and punctuation patterns EXACTLY.
• Hashtags should follow their established formula.
• Return ONLY valid JSON — no markdown, no commentary.`;

export interface GeneratedContentResult {
  caption: string;
  hashtags: string[];
}

export async function generateContentWithBedrock(
  voiceDNA: any,
  context: string,
  contentType: 'caption' | 'hashtags' | 'full' = 'full',
): Promise<GeneratedContentResult> {
  const typeInstruction =
    contentType === 'caption'
      ? 'Generate only the caption text. Set hashtags to an empty array.'
      : contentType === 'hashtags'
        ? 'Generate only hashtags. Set caption to an empty string.'
        : 'Generate both caption and hashtags.';

  const userMessage = `Voice DNA Profile:
${JSON.stringify(voiceDNA, null, 2)}

Context / Topic: ${context}

${typeInstruction}

Return JSON: { "caption": "...", "hashtags": ["...", "..."] }`;

  const raw = await converse({
    systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1024,
  });

  return parseJsonResponse<GeneratedContentResult>(raw);
}

// ─── Exports ─────────────────────────────────────────────────────

export { converse, parseJsonResponse };
