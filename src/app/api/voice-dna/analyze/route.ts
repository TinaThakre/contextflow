/**
 * POST /api/voice-dna/analyze
 *
 * Complete Flow:
 *   1. Authenticate user
 *   2. Scrape social media posts from provided handles
 *   3. Parse and normalize posts
 *   4. Generate Voice DNA using AWS Bedrock
 *   5. Save Voice DNA to database
 *   6. Return complete results
 *
 * This endpoint orchestrates the entire Voice DNA creation pipeline
 * in a single request for a cleaner user experience.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { scrapeMultiplePlatforms } from '@/lib/social-scrapers';
import type { ParsedInstagramPost } from '@/lib/instagram-parser';
import { createVoiceDNA } from '@/lib/voice-dna-service';
import { bulkSavePosts, saveRawScrape } from '@/lib/database';
import type { StoredPost } from '@/types/voice-dna';

interface AnalyzeRequest {
  platforms: Array<{
    platform: 'instagram' | 'twitter' | 'linkedin';
    username: string;
  }>;
  limit?: number;
}

interface AnalyzeResponse {
  success: boolean;
  message: string;
  data?: {
    scraped: Record<string, {
      totalPosts: number;
      success: boolean;
      error?: string;
    }>;
    voiceDNA: Record<string, {
      id: string;
      confidence: number;
      version: string;
    }>;
    scrapedPosts: ParsedInstagramPost[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // ── Auth ─────────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const auth = getAuth();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (_authError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token', error: 'Token verification failed' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const body = (await request.json()) as AnalyzeRequest;
    const { platforms, limit = 50 } = body;

    // ── Validate ─────────────────────────────────────────────────
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request',
          error: 'Missing or invalid platforms array',
        },
        { status: 400 }
      );
    }

    const postLimit = Math.min(Math.max(Number(limit) || 50, 10), 100);

    for (const platform of platforms) {
      if (!platform.platform || !platform.username) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid request',
            error: 'Each platform must have platform and username fields',
          },
          { status: 400 }
        );
      }
    }

    console.log(`[analyze] user=${userId} platforms=${JSON.stringify(platforms)} limit=${postLimit}`);

    // ── Step 1: Scrape posts ────────────────────────────────────
    console.log('[analyze] Step 1: Scraping from RapidAPI...');
    const rawResults = await scrapeMultiplePlatforms(platforms, postLimit);

    const scrapeResults: Record<string, {
      totalPosts: number;
      success: boolean;
      error?: string;
    }> = {};
    const allParsedPosts: Record<string, ParsedInstagramPost[]> = {};

    // ── Step 2: Parse and persist posts ────────────────────────
    console.log('[analyze] Step 2: Parsing posts and persisting to database...');
    for (const platformEntry of platforms) {
      const platformName = platformEntry.platform as string;
      const username = platformEntry.username as string;
      const rawResult = rawResults[platformName];

      if (!rawResult?.success || !rawResult.posts?.length) {
        scrapeResults[platformName] = {
          totalPosts: 0,
          success: false,
          error: rawResult?.error || 'No posts found',
        };
        allParsedPosts[platformName] = [];
        continue;
      }

      // Save raw response for audit
      try {
        await saveRawScrape(userId, platformName, username, rawResult, rawResult.posts.length);
        console.log(`[analyze] Saved raw ${platformName} response (${rawResult.posts.length} posts)`);
      } catch (rawErr) {
        console.error(`[analyze] Failed to save raw response for ${platformName}:`, rawErr);
      }

      // Convert already-normalized ScrapedPost objects → ParsedInstagramPost.
      // NOTE: scrapeInstagram() has already extracted caption into `text`,
      // like_count into `likes`, comment_count into `comments`, and
      // taken_at into a ISO-string `timestamp`. Running parseInstagramData()
      // again would see undefined for all those raw fields and return empty
      // captions/zero counts. We map directly instead.
      const parsed: ParsedInstagramPost[] = rawResult.posts
        .filter((p: any) => p.id)
        .map((p: any) => {
          const captionText: string = p.text || '';
          // Re-extract hashtags using the same pattern as the parser
          const hashtagMatches = captionText.match(/#[\w\u0900-\u097F]+/g);
          const hashtags: string[] = hashtagMatches
            ? hashtagMatches.map((t: string) => t.toLowerCase())
            : [];
          // Convert ISO timestamp string → unix seconds
          const timestamp: number = p.timestamp
            ? Math.floor(new Date(p.timestamp).getTime() / 1000)
            : 0;
          return {
            id: String(p.id),
            code: p.code || '',
            caption: captionText,
            hashtags,
            timestamp,
            mediaType: (p.mediaType || 'image') as 'image' | 'video' | 'carousel',
            mediaUrl: p.mediaUrl || '',
            likeCount: p.likes ?? 0,
            commentCount: p.comments ?? 0,
          } satisfies ParsedInstagramPost;
        });
      allParsedPosts[platformName] = parsed;

      // Persist to database
      if (parsed.length > 0) {
        const rows: Omit<StoredPost, 'id'>[] = parsed.map((p) => ({
          userId,
          platform: platformName as 'instagram' | 'twitter' | 'linkedin',
          postId: p.id,
          postUrl: p.code ? `https://instagram.com/p/${p.code}` : '',
          mediaUrls: [p.mediaUrl, ...(p.carouselMedia?.map((c) => c.url) ?? [])].filter(Boolean),
          mediaType: p.mediaType,
          caption: p.caption,
          hashtags: p.hashtags,
          engagement: {
            likes: p.likeCount,
            comments: p.commentCount,
          },
          createdAt: p.timestamp ? p.timestamp * 1000 : Date.now(),
        }));

        try {
          await bulkSavePosts(rows);
          console.log(`[analyze] Persisted ${rows.length} parsed ${platformName} posts`);
        } catch (dbErr) {
          console.error(`[analyze] DB save failed for ${platformName}:`, dbErr);
        }
      }

      scrapeResults[platformName] = {
        totalPosts: parsed.length,
        success: true,
      };
    }

    // ── Step 3: Generate Voice DNA for each platform ──────────────
    console.log('[analyze] Step 3: Generating Voice DNA with Bedrock...');
    const voiceDNAResults: Record<string, {
      id: string;
      confidence: number;
      version: string;
    }> = {};

    for (const platformEntry of platforms) {
      const platformName = platformEntry.platform as string;
      const parsed = allParsedPosts[platformName];

      if (parsed.length === 0) {
        console.log(`[analyze] No posts for ${platformName}, skipping Voice DNA generation`);
        continue;
      }

      try {
        const minPosts = parseInt(process.env.VOICE_DNA_MIN_POSTS || '5', 10);
        if (parsed.length < minPosts) {
          console.warn(
            `[analyze] Insufficient posts for ${platformName}: ${parsed.length} < ${minPosts}`
          );
          continue;
        }

        console.log(`[analyze] Generating Voice DNA for ${platformName} with ${parsed.length} posts...`);
        const voiceDNA = await createVoiceDNA(userId, platformName as any, parsed);

        voiceDNAResults[platformName] = {
          id: voiceDNA.id,
          confidence: voiceDNA.confidence.overallConfidence,
          version: voiceDNA.version,
        };

        console.log(`[analyze] Voice DNA generated for ${platformName}`);
      } catch (voiceErr) {
        console.error(`[analyze] Voice DNA generation failed for ${platformName}:`, voiceErr);
        voiceDNAResults[platformName] = {
          id: '',
          confidence: 0,
          version: '1.0.0',
        };
      }
    }

    // ── Return success ───────────────────────────────────────────
    console.log('[analyze] Pipeline complete');

    // Flatten all parsed posts from all platforms into a single array,
    // tagging each with its platform so the UI can render the correct badge.
    const allScrapedPosts = Object.entries(allParsedPosts).flatMap(
      ([platformName, posts]) =>
        posts.map((post) => ({ ...post, platform: platformName })),
    );

    return NextResponse.json({
      success: true,
      message: 'Voice DNA analysis complete',
      data: {
        scraped: scrapeResults,
        voiceDNA: voiceDNAResults,
        scrapedPosts: allScrapedPosts,
      },
    });
  } catch (error: any) {
    console.error('[analyze] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
