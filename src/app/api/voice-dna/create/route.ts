/**
 * POST /api/voice-dna/create
 *
 * Retrieves persisted posts from the database, maps them to
 * ParsedInstagramPost shape, and runs the Voice DNA pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getPostsByUser } from '@/lib/database';
import { createVoiceDNA } from '@/lib/voice-dna-service';
import type { StoredPost } from '@/types/voice-dna';
import type { ParsedInstagramPost } from '@/lib/instagram-parser';

/** Map a DB-persisted StoredPost back to the ParsedInstagramPost shape. */
function storedToParseShape(post: StoredPost): ParsedInstagramPost {
  // postUrl: "https://instagram.com/p/CODE" → extract code
  const codeMatch = post.postUrl.match(/\/p\/([^/?]+)/);
  const code = codeMatch?.[1] ?? '';
  return {
    id: post.postId,
    code,
    postUrl: post.postUrl || (code ? `https://www.instagram.com/p/${code}/` : ''),
    caption: post.caption ?? '',
    hashtags: post.hashtags ?? [],
    timestamp: typeof post.createdAt === 'number'
      ? Math.floor(post.createdAt / 1000)
      : Math.floor(new Date(post.createdAt).getTime() / 1000),
    mediaType: post.mediaType ?? 'image',
    mediaUrl: post.mediaUrls?.[0] ?? '',
    carouselMedia:
      post.mediaType === 'carousel' && post.mediaUrls?.length > 1
        ? post.mediaUrls.slice(1).map((url) => ({ url, type: 'image' as const }))
        : [],
    likeCount: post.engagement?.likes ?? 0,
    commentCount: post.engagement?.comments ?? 0,
  };
}

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
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    console.log(`[voice-dna/create] user=${userId} platform=${platform}`);

    // ── Fetch stored posts ───────────────────────────────────────
    const dbPosts = await getPostsByUser(userId, platform);

    if (dbPosts.length === 0) {
      return NextResponse.json(
        { error: 'No posts found', message: 'Please scrape social media posts first' },
        { status: 404 },
      );
    }

    const minPosts = parseInt(process.env.VOICE_DNA_MIN_POSTS || '10', 10);
    if (dbPosts.length < minPosts) {
      return NextResponse.json(
        {
          error: 'Insufficient posts',
          message: `At least ${minPosts} posts are required. Found ${dbPosts.length} posts.`,
        },
        { status: 400 },
      );
    }

    // ── Map StoredPost → ParsedInstagramPost ─────────────────────
    const parsedPosts: ParsedInstagramPost[] = dbPosts.map(storedToParseShape);

    // ── Run pipeline ─────────────────────────────────────────────
    const voiceDNA = await createVoiceDNA(userId, platform, parsedPosts);

    console.log(`[voice-dna/create] Voice DNA created for user=${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Voice DNA created successfully',
      data: {
        voiceDNA: {
          id: voiceDNA.id,
          version: voiceDNA.version,
          platform: voiceDNA.platform,
          confidence: voiceDNA.confidence,
          createdAt: voiceDNA.createdAt,
          coreIdentity: voiceDNA.coreIdentity,
        },
        postsAnalyzed: parsedPosts.length,
      },
    });
  } catch (error: any) {
    console.error('[voice-dna/create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create Voice DNA', details: error.message },
      { status: 500 },
    );
  }
}
