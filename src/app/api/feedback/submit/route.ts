/**
 * POST /api/feedback/submit
 * Submit user feedback on generated content (thumbs up/down)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { saveFeedback } from '@/lib/database';
import { GeneratedContentFeedback } from '@/types/voice-dna';

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
    const {
      generatedContentId,
      platform,
      content,
      rating,
      specificIssues,
      editedVersion,
      usedInPost,
      generationContext,
    } = body;

    // Validate required fields
    if (!generatedContentId || !platform || !content || !rating || !generationContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['thumbs_up', 'thumbs_down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be: thumbs_up or thumbs_down' },
        { status: 400 }
      );
    }

    console.log(`Submitting feedback for user ${userId}: ${rating}`);

    // Create feedback object
    const feedback: Omit<GeneratedContentFeedback, 'id'> = {
      userId,
      platform,
      generatedContentId,
      content: {
        caption: content.caption || '',
        hashtags: content.hashtags || [],
        visualGuidelines: content.visualGuidelines,
      },
      feedback: {
        rating,
        timestamp: Date.now(),
        specificIssues,
        editedVersion,
        usedInPost,
      },
      generationContext: {
        voiceDNAVersion: generationContext.voiceDNAVersion,
        prompt: generationContext.prompt || '',
        visualContext: generationContext.visualContext,
        confidenceScore: generationContext.confidenceScore || 0,
      },
      learningData: {
        processed: false,
        appliedToVoiceDNA: false,
        impactScore: 0,
      },
    };

    // Save feedback
    const feedbackId = await saveFeedback(feedback);

    console.log(`Feedback saved successfully: ${feedbackId}`);

    // TODO: Trigger async feedback processing job
    // This will analyze feedback and update Voice DNA

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId,
        rating,
      },
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
