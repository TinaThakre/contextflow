/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const firestore = getFirestore();

    // Fetch user's scraped data
    const scrapeDoc = await firestore
      .collection('social_scrapes')
      .doc(userId)
      .get();

    const scrapeData = scrapeDoc.exists ? scrapeDoc.data() : null;

    // Fetch user profile
    const profileDoc = await firestore
      .collection('profiles')
      .doc(userId)
      .get();

    const profileData = profileDoc.exists ? profileDoc.data() : null;

    // Calculate stats
    const totalPosts = scrapeData?.totalPosts || 0;
    const connectedPlatforms = profileData?.connectedPlatforms || [];
    const voiceDnaConfidence = profileData?.voiceDnaConfidence || 0;
    const onboardingCompleted = profileData?.onboardingCompleted || false;

    // Get recent content from scraped posts
    const recentContent: any[] = [];
    if (scrapeData?.results) {
      Object.entries(scrapeData.results).forEach(([platform, result]: [string, any]) => {
        if (result.posts && Array.isArray(result.posts)) {
          result.posts.slice(0, 3).forEach((post: any) => {
            recentContent.push({
              platform,
              content: post.text || 'No content',
              status: 'published',
              engagement: (post.likes || 0) + (post.comments || 0),
              time: post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Unknown',
              likes: post.likes || 0,
              comments: post.comments || 0,
            });
          });
        }
      });
    }

    // Sort by engagement
    recentContent.sort((a, b) => b.engagement - a.engagement);

    return NextResponse.json({
      stats: {
        totalPosts,
        connectedPlatforms: connectedPlatforms.length,
        voiceDnaConfidence,
        onboardingCompleted,
      },
      recentContent: recentContent.slice(0, 5),
      connectedPlatforms,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
