/**
 * POST /api/social/scrape
 *
 * Pipeline:
 *   1. Validate auth + request body
 *   2. Call RapidAPI via social-scrapers
 *   3. Save raw response to raw_scrapes table (audit)
 *   4. Parse with instagram-parser → normalized posts
 *   5. Bulk-save parsed posts to user_posts (idempotent)
 *   6. Store metadata in Firestore (legacy)
 *   7. Return parsed posts to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';
import { scrapeMultiplePlatforms } from '@/lib/social-scrapers';
import { parseInstagramData, type ParsedInstagramPost } from '@/lib/instagram-parser';
import { bulkSavePosts, saveRawScrape } from '@/lib/database';
import type { StoredPost } from '@/types/voice-dna';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = getAuth();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (_authError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await request.json();
    const { platforms, limit = 50 } = body;

    // ── Validate ─────────────────────────────────────────────────
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid platforms array' },
        { status: 400 },
      );
    }

    const postLimit = Math.min(Math.max(Number(limit) || 50, 10), 100);

    for (const platform of platforms) {
      if (!platform.platform || !platform.username) {
        return NextResponse.json(
          { error: 'Each platform must have platform and username fields' },
          { status: 400 },
        );
      }
    }

    console.log(`[scrape] user=${userId} platforms=${JSON.stringify(platforms)} limit=${postLimit}`);

    // ── Step 1: Scrape via RapidAPI ──────────────────────────────
    const rawResults = await scrapeMultiplePlatforms(platforms, postLimit);

    // ── Step 2: For each platform — save raw, parse, persist ─────
    const allParsed: Record<string, ParsedInstagramPost[]> = {};
    let totalParsed = 0;

    for (const platformEntry of platforms) {
      const platformName = platformEntry.platform as string;
      const username = platformEntry.username as string;
      const rawResult = rawResults[platformName];

      if (!rawResult?.success || !rawResult.posts?.length) {
        allParsed[platformName] = [];
        continue;
      }

      // Save raw response for audit/debug
      try {
        await saveRawScrape(
          userId,
          platformName,
          username,
          rawResult,
          rawResult.posts.length,
        );
        console.log(`[scrape] Saved raw ${platformName} response (${rawResult.posts.length} posts)`);
      } catch (rawErr) {
        console.error(`[scrape] Failed to save raw response for ${platformName}:`, rawErr);
        // Non-blocking — continue pipeline
      }

      // Parse: transform RapidAPI shape → normalized ParsedInstagramPost[]
      // The scraper returns { posts: [...] } where each post is a raw node.
      // Wrap in the edge/node format that the parser expects.
      const syntheticRaw = {
        result: {
          edges: rawResult.posts.map((p: any) => ({ node: p })),
        },
      };
      const parsed = parseInstagramData(syntheticRaw);
      allParsed[platformName] = parsed;
      totalParsed += parsed.length;

      // Persist parsed posts to Postgres (idempotent)
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
          console.log(`[scrape] Persisted ${rows.length} parsed ${platformName} posts`);
        } catch (dbErr) {
          console.error(`[scrape] DB save failed for ${platformName}:`, dbErr);
        }
      }
    }

    // ── Step 3: Firestore metadata (legacy) ──────────────────────
    try {
      const firestore = getFirestore();
      await firestore.collection('social_scrapes').doc(userId).set(
        {
          userId,
          platforms: platforms.map((p: any) => p.platform),
          postLimit,
          scrapedAt: new Date().toISOString(),
          totalPosts: totalParsed,
        },
        { merge: true },
      );

      await firestore.collection('profiles').doc(userId).set(
        {
          connectedPlatforms: platforms.map((p: any) => ({
            platform: p.platform,
            username: p.username,
            connectedAt: new Date().toISOString(),
          })),
          onboardingCompleted: false,
          onboardingStep: 'analyzing',
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (firestoreErr) {
      console.error('[scrape] Firestore write failed:', firestoreErr);
    }

    // ── Step 4: Return parsed + raw results ──────────────────────
    console.log(`[scrape] Done — ${totalParsed} posts parsed for user=${userId}`);

    return NextResponse.json({
      success: true,
      totalPosts: totalParsed,
      parsed: allParsed,
      results: rawResults, // keep raw result summary for backward compat
      message: `Successfully scraped and parsed ${totalParsed} posts from ${platforms.length} platform(s)`,
    });
  } catch (error: any) {
    console.error('[scrape] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
