/**
 * POST /api/content/generate
 * Generate content (captions/hashtags) using Voice DNA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { generateContent } from '@/lib/voice-dna-service';

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
    const { platform, context, contentType = 'full' } = body;

    if (!platform || !context) {
      return NextResponse.json(
        { error: 'Platform and context are required' },
        { status: 400 }
      );
    }

    if (!['caption', 'hashtags', 'full'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid contentType. Must be: caption, hashtags, or full' },
        { status: 400 }
      );
    }

    console.log(`Generating ${contentType} for user ${userId} on ${platform}`);

    // Generate content
    const generated = await generateContent(userId, platform, context, contentType);

    console.log(`Content generated successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: generated,
    });
  } catch (error: any) {
    console.error('Content generation error:', error);
    
    // Handle specific errors
    if (error.message.includes('Voice DNA not found')) {
      return NextResponse.json(
        { 
          error: 'Voice DNA not found',
          message: 'Please create Voice DNA first by analyzing your social media posts'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
