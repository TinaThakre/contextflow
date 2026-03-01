/**
 * Voice DNA Service — Core Pipeline
 *
 * Flow:
 *   1. Accept parsed posts (ParsedInstagramPost[])
 *   2. Persist posts to DB (idempotent upsert)
 *   3. Send entire post corpus to Bedrock in a single Converse call
 *   4. Compute confidence scores locally
 *   5. Persist final VoiceDNA to DB + history
 *   6. Return VoiceDNA to caller
 *
 * Designed for extensibility: add YouTube/LinkedIn/Twitter parsers that
 * produce the same ParsedInstagramPost-like shape and feed them in.
 */

import { VoiceDNA, StoredPost, GeneratedContent, ConfidenceScores } from '@/types/voice-dna';
import { generateVoiceDNA, generateContentWithBedrock } from './aws-services';
import type { ParsedInstagramPost } from './instagram-parser';
import {
  saveVoiceDNA,
  getVoiceDNA,
  bulkSavePosts,
} from './database';

// ─── Voice DNA Creation ──────────────────────────────────────────

export async function createVoiceDNA(
  userId: string,
  platform: 'instagram' | 'twitter' | 'linkedin',
  parsedPosts: ParsedInstagramPost[],
): Promise<VoiceDNA> {
  console.log(`[VoiceDNA] Creating for user=${userId} platform=${platform} posts=${parsedPosts.length}`);

  // Step 1: Persist posts (idempotent — ON CONFLICT DO NOTHING)
  const storedPosts: Omit<StoredPost, 'id'>[] = parsedPosts.map((p) => ({
    userId,
    platform,
    postId: p.id,
    postUrl: p.code ? `https://instagram.com/p/${p.code}` : '',
    mediaUrls: collectAllMediaUrls(p),
    mediaType: p.mediaType,
    caption: p.caption,
    hashtags: p.hashtags,
    engagement: {
      likes: p.likeCount,
      comments: p.commentCount,
    },
    createdAt: p.timestamp ? p.timestamp * 1000 : Date.now(),
  }));

  await bulkSavePosts(storedPosts);
  console.log(`[VoiceDNA] Persisted ${storedPosts.length} posts`);

  // Step 2: Call Bedrock (single Converse call)
  console.log('[VoiceDNA] Calling Bedrock for Voice DNA generation...');
  const dnaData = await generateVoiceDNA(parsedPosts);
  console.log('[VoiceDNA] Bedrock returned Voice DNA');

  // Step 3: Compute confidence locally
  const confidence = computeConfidence(parsedPosts);

  // Step 4: Assemble final object
  const voiceDNA: VoiceDNA = {
    id: `${userId}_${platform}_${Date.now()}`,
    userId,
    platform,
    version: '1.0.0',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    coreIdentity: dnaData.coreIdentity,
    writingDNA: dnaData.writingDNA,
    visualDNA: dnaData.visualDNA,
    strategyDNA: dnaData.strategyDNA,
    behavioralDNA: dnaData.behavioralDNA,
    generationTemplates: dnaData.generationTemplates,
    confidence,
  };

  // Step 5: Save to DB + history
  await saveVoiceDNA(voiceDNA);
  console.log('[VoiceDNA] Saved to database');

  return voiceDNA;
}

// ─── Content Generation ──────────────────────────────────────────

export async function generateContent(
  userId: string,
  platform: 'instagram' | 'twitter' | 'linkedin',
  context: string,
  contentType: 'caption' | 'hashtags' | 'full' = 'full',
): Promise<GeneratedContent> {
  const voiceDNA = await getVoiceDNA(userId, platform);
  if (!voiceDNA) {
    throw new Error('Voice DNA not found. Please create Voice DNA first.');
  }

  const generated = await generateContentWithBedrock(voiceDNA, context, contentType);

  return {
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    caption: generated.caption || '',
    hashtags: generated.hashtags || [],
    visualGuidelines: voiceDNA.generationTemplates?.visualGuidelines,
    metadata: {
      voiceDNAVersion: voiceDNA.version,
      confidenceScore: voiceDNA.confidence.overallConfidence,
      generatedAt: Date.now(),
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Collect primary + carousel URLs for a post. */
function collectAllMediaUrls(post: ParsedInstagramPost): string[] {
  const urls: string[] = [];
  if (post.mediaUrl) urls.push(post.mediaUrl);
  if (post.carouselMedia) {
    for (const item of post.carouselMedia) {
      if (item.url) urls.push(item.url);
    }
  }
  return urls;
}

/** Compute confidence scores from local post data (no AI call needed). */
function computeConfidence(posts: ParsedInstagramPost[]): ConfidenceScores {
  const sampleSize = posts.length;

  // Date range in days
  const timestamps = posts.map((p) => p.timestamp).filter(Boolean);
  const oldestSec = Math.min(...timestamps);
  const newestSec = Math.max(...timestamps);
  const dateRange = timestamps.length >= 2
    ? Math.floor((newestSec - oldestSec) / 86400)
    : 0;

  // Completeness: fraction of posts that have caption AND hashtags AND media
  const withCaption = posts.filter((p) => p.caption.length > 0).length;
  const withHashtags = posts.filter((p) => p.hashtags.length > 0).length;
  const withMedia = posts.filter((p) => p.mediaUrl.length > 0).length;
  const completeness = sampleSize > 0
    ? (withCaption + withHashtags + withMedia) / (sampleSize * 3)
    : 0;

  const sampleScore = Math.min(sampleSize / 50, 1);
  const dateScore = Math.min(dateRange / 90, 1);
  const overallConfidence = Math.round(
    ((sampleScore + dateScore + completeness) / 3) * 100,
  ) / 100;

  return {
    overallConfidence,
    dataQuality: {
      sampleSize,
      dateRange,
      completeness: Math.round(completeness * 100) / 100,
    },
    analysisDepth: {
      textualAnalysis: sampleSize > 0 ? withCaption / sampleSize : 0,
      visualAnalysis: sampleSize > 0 ? withMedia / sampleSize : 0,
      correlationAnalysis: 0.8, // Placeholder — single-call analysis covers correlation
    },
  };
}
