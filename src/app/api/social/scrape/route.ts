/**
 * POST /api/social/scrape
 * Scrape social media posts for Voice DNA analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';
import { scrapeMultiplePlatforms } from '@/lib/social-scrapers';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { platforms, limit = 50 } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid platforms array' },
        { status: 400 }
      );
    }

    // Validate limit
    const postLimit = Math.min(Math.max(Number(limit) || 50, 10), 100);

    // Validate platform data
    for (const platform of platforms) {
      if (!platform.platform || !platform.username) {
        return NextResponse.json(
          { error: 'Each platform must have platform and username fields' },
          { status: 400 }
        );
      }
    }

    console.log(`Scraping social media for user ${userId}:`, platforms, `(limit: ${postLimit})`);

    // Scrape all platforms
    const results = await scrapeMultiplePlatforms(platforms, postLimit);

    // Calculate total posts scraped
    const totalPosts = Object.values(results).reduce(
      (sum, result) => sum + (result.posts?.length || 0),
      0
    );

    // Store scraped data in Firestore
    const firestore = getFirestore();
    const scrapedData: any = {
      userId,
      platforms: platforms.map((p) => p.platform),
      postLimit,
      scrapedAt: new Date().toISOString(),
      totalPosts,
      results: {},
    };

    // Store results for each platform
    for (const [platform, result] of Object.entries(results)) {
      scrapedData.results[platform] = {
        success: result.success,
        totalPosts: result.posts?.length || 0,
        posts: result.posts || [],
        // Only include error if it exists (not undefined)
        ...(result.error && { error: result.error }),
      };
    }

    // Save to Firestore
    await firestore.collection('social_scrapes').doc(userId).set(scrapedData, { merge: true });

    // Update user profile with connected platforms
    await firestore.collection('profiles').doc(userId).set(
      {
        connectedPlatforms: platforms.map((p) => ({
          platform: p.platform,
          username: p.username,
          connectedAt: new Date().toISOString(),
        })),
        onboardingCompleted: false,
        onboardingStep: 'analyzing',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`Successfully scraped ${totalPosts} posts for user ${userId}`);

    return NextResponse.json({
      success: true,
      totalPosts,
      results,
      message: `Successfully scraped ${totalPosts} posts from ${platforms.length} platform(s)`,
    });
  } catch (error: any) {
    console.error('Social scrape error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
