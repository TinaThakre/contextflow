/**
 * POST /api/voice-dna/create
 * Create Voice DNA from scraped social media posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getPostsByUser } from '@/lib/database';
import { createVoiceDNA } from '@/lib/voice-dna-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    console.log(`Creating Voice DNA for user ${userId} on ${platform}`);

    // Get posts from database
    const posts = await getPostsByUser(userId, platform);

    if (posts.length === 0) {
      return NextResponse.json(
        { 
          error: 'No posts found',
          message: 'Please scrape social media posts first'
        },
        { status: 404 }
      );
    }

    // Check minimum posts requirement
    const minPosts = parseInt(process.env.VOICE_DNA_MIN_POSTS || '10');
    if (posts.length < minPosts) {
      return NextResponse.json(
        { 
          error: 'Insufficient posts',
          message: `At least ${minPosts} posts are required. Found ${posts.length} posts.`
        },
        { status: 400 }
      );
    }

    // Create Voice DNA (this is a long-running operation)
    const voiceDNA = await createVoiceDNA(userId, platform, posts);

    console.log(`Voice DNA created successfully for user ${userId}`);

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
        postsAnalyzed: posts.length,
      },
    });
  } catch (error: any) {
    console.error('Voice DNA creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Voice DNA',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
