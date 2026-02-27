/**
 * POST /api/social/scrape
 * Scrape social media posts for Voice DNA analysis
 * Saves to both Firestore (legacy) and Supabase (Voice DNA pipeline)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';
import { scrapeMultiplePlatforms } from '@/lib/social-scrapers';
import { bulkSavePosts } from '@/lib/database';
import { StoredPost } from '@/types/voice-dna';

// Extract media URLs from post
function extractMediaUrls(post: any): string[] {
  const urls: string[] = [];

  if (post.video_versions && post.video_versions.length > 0) {
    urls.push(post.video_versions[0].url);
  }

  if (post.image_versions2?.candidates && post.image_versions2.candidates.length > 0) {
    urls.push(post.image_versions2.candidates[0].url);
  }

  if (post.carousel_media) {
    for (const media of post.carousel_media) {
      if (media.image_versions2?.candidates?.[0]?.url) {
        urls.push(media.image_versions2.candidates[0].url);
      }
    }
  }

  return urls;
}

// Determine media type
function determineMediaType(post: any): 'image' | 'video' | 'carousel' {
  if (post.carousel_media) return 'carousel';
  if (post.video_versions) return 'video';
  return 'image';
}

// Extract hashtags
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.toLowerCase()) : [];
}

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

    // Transform posts for Supabase (Voice DNA pipeline)
    const supabasePosts: Omit<StoredPost, 'id'>[] = [];
    
    for (const [platformName, result] of Object.entries(results)) {
      if (result.success && result.posts) {
        for (const post of result.posts) {
          supabasePosts.push({
            userId,
            platform: platformName as 'instagram' | 'twitter' | 'linkedin',
            postId: post.pk || post.id || String(post.code),
            postUrl: post.code ? `https://instagram.com/p/${post.code}` : '',
            mediaUrls: extractMediaUrls(post),
            mediaType: determineMediaType(post),
            caption: post.caption?.text || post.text || '',
            hashtags: extractHashtags(post.caption?.text || post.text || ''),
            engagement: {
              likes: post.like_count || 0,
              comments: post.comment_count || 0,
              viewCount: post.view_count,
            },
            createdAt: post.taken_at ? post.taken_at * 1000 : Date.now(),
          });
        }
      }
    }

    // Save to Supabase for Voice DNA pipeline
    if (supabasePosts.length > 0) {
      try {
        await bulkSavePosts(supabasePosts);
        console.log(`Saved ${supabasePosts.length} posts to Supabase for Voice DNA`);
      } catch (supabaseError) {
        console.error('Failed to save to Supabase:', supabaseError);
        // Continue even if Supabase fails - Firestore is primary
      }
    }

    // Store scraped data in Firestore (legacy)
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
      savedToSupabase: supabasePosts.length,
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
