/**
 * Social Media Scrapers using RapidAPI
 * Handles scraping content from Instagram, LinkedIn, and Twitter
 * 
 * IMPORTANT: Configure these RapidAPI hosts based on your subscriptions:
 * 
 * Instagram options:
 * - instagram-scraper-api2.p.rapidapi.com
 * - instagram-bulk-profile-scrapper.p.rapidapi.com
 * - instagram-scraper-2022.p.rapidapi.com
 * 
 * LinkedIn options:
 * - linkedin-data-api.p.rapidapi.com
 * - linkedin-api8.p.rapidapi.com
 * - fresh-linkedin-profile-data.p.rapidapi.com
 * 
 * Twitter options:
 * - twitter-api45.p.rapidapi.com
 * - twitter154.p.rapidapi.com
 * - twitter-v2.p.rapidapi.com
 * 
 * Check your RapidAPI dashboard for the exact API names you're subscribed to
 * and update the hosts below accordingly.
 */

import { config } from './config';

const RAPIDAPI_KEY = config.external.rapidApiKey;
const RAPIDAPI_HOST_INSTAGRAM = config.external.rapidApiHostInstagram;
const RAPIDAPI_HOST_LINKEDIN = config.external.rapidApiHostLinkedIn;
const RAPIDAPI_HOST_TWITTER = config.external.rapidApiHostTwitter;

export interface ScrapedPost {
  id: string;
  text: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface ScraperResult {
  success: boolean;
  posts: ScrapedPost[];
  error?: string;
  totalPosts?: number;
}

/**
 * Scrape Instagram posts by username
 */
export async function scrapeInstagram(username: string, limit: number = 50): Promise<ScraperResult> {
  try {
    console.log('Scraping Instagram username:', username);
    
    // Use POST request with JSON body (as per your working curl command)
    const response = await fetch(
      `https://${RAPIDAPI_HOST_INSTAGRAM}/api/instagram/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_INSTAGRAM,
        },
        body: JSON.stringify({
          username: username,
          maxId: '',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram API error response:', errorText);
      throw new Error(`Instagram API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('Instagram API response:', JSON.stringify(data).substring(0, 500));
    
    // Parse Instagram response based on actual API structure
    // The API returns: { result: { edges: [ { node: { ... } } ] } }
    const edges = data.result?.edges || data.data?.edges || data.edges || [];
    const posts: ScrapedPost[] = edges.slice(0, limit).map((edge: any) => {
      const node = edge.node || edge;
      return {
        id: node.id || node.pk || node.code || String(Math.random()),
        text: node.caption?.text || node.caption || node.text || '',
        timestamp: node.caption?.created_at 
          ? new Date(node.caption.created_at * 1000).toISOString() 
          : node.taken_at 
          ? new Date(node.taken_at * 1000).toISOString()
          : new Date().toISOString(),
        likes: node.like_count || node.likes || 0,
        comments: node.comment_count || node.comments || 0,
      };
    });

    console.log(`Successfully scraped ${posts.length} Instagram posts`);

    return {
      success: true,
      posts,
      totalPosts: posts.length,
    };
  } catch (error: any) {
    console.error('Instagram scraper error:', error);
    return {
      success: false,
      posts: [],
      error: error.message || 'Failed to scrape Instagram',
    };
  }
}

/**
 * Scrape LinkedIn posts by profile URL
 * Note: Different RapidAPI LinkedIn scrapers have different endpoints and parameters
 * You may need to adjust this based on your specific RapidAPI subscription
 */
export async function scrapeLinkedIn(profileUrl: string, limit: number = 50): Promise<ScraperResult> {
  try {
    console.log('Scraping LinkedIn profile:', profileUrl);
    
    // Extract username from LinkedIn URL
    const usernameMatch = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    const username = usernameMatch ? usernameMatch[1] : profileUrl;
    
    console.log('Extracted LinkedIn username:', username);
    
    // Try multiple LinkedIn API endpoints (different RapidAPI providers have different formats)
    
    // Option 1: Try with profile URL parameter
    let response = await fetch(
      `https://${RAPIDAPI_HOST_LINKEDIN}/get-profile-posts?url=${encodeURIComponent(profileUrl)}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_LINKEDIN,
        },
      }
    );

    // Option 2: If first fails, try with username parameter
    if (!response.ok) {
      console.log('First LinkedIn endpoint failed, trying alternative...');
      response = await fetch(
        `https://${RAPIDAPI_HOST_LINKEDIN}/get-profile-posts?username=${username}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST_LINKEDIN,
          },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn API error response:', errorText);
      throw new Error(`LinkedIn API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('LinkedIn API response:', JSON.stringify(data).substring(0, 500));
    
    // Parse LinkedIn response (adjust based on actual API response structure)
    const posts: ScrapedPost[] = (data.data || data.posts || data.items || []).slice(0, limit).map((item: any) => ({
      id: item.urn || item.id || item.postId || String(Math.random()),
      text: item.commentary?.text || item.text || item.content || item.description || '',
      timestamp: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
      likes: item.numLikes || item.likes || item.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
      comments: item.numComments || item.comments || item.socialDetail?.totalSocialActivityCounts?.numComments || 0,
      shares: item.numShares || item.shares || item.socialDetail?.totalSocialActivityCounts?.numShares || 0,
    }));

    return {
      success: true,
      posts,
      totalPosts: posts.length,
    };
  } catch (error: any) {
    console.error('LinkedIn scraper error:', error);
    return {
      success: false,
      posts: [],
      error: error.message || 'Failed to scrape LinkedIn. Please check your RapidAPI subscription and API endpoint.',
    };
  }
}

/**
 * Scrape Twitter/X posts by username
 */
export async function scrapeTwitter(username: string, limit: number = 50): Promise<ScraperResult> {
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST_TWITTER}/timeline.php?screenname=${username}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_TWITTER,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Twitter response
    const posts: ScrapedPost[] = (data.timeline || []).slice(0, limit).map((item: any) => ({
      id: item.tweet_id || item.id_str,
      text: item.text || item.full_text || '',
      timestamp: item.created_at || new Date().toISOString(),
      likes: item.favorite_count,
      comments: item.reply_count,
      shares: item.retweet_count,
    }));

    return {
      success: true,
      posts,
      totalPosts: posts.length,
    };
  } catch (error: any) {
    console.error('Twitter scraper error:', error);
    return {
      success: false,
      posts: [],
      error: error.message || 'Failed to scrape Twitter',
    };
  }
}

/**
 * Scrape posts from multiple platforms
 */
export async function scrapeMultiplePlatforms(
  platforms: Array<{
    platform: 'instagram' | 'linkedin' | 'twitter';
    username: string;
  }>,
  limit: number = 50
): Promise<Record<string, ScraperResult>> {
  const results: Record<string, ScraperResult> = {};

  await Promise.all(
    platforms.map(async ({ platform, username }) => {
      switch (platform) {
        case 'instagram':
          results[platform] = await scrapeInstagram(username, limit);
          break;
        case 'linkedin':
          results[platform] = await scrapeLinkedIn(username, limit);
          break;
        case 'twitter':
          results[platform] = await scrapeTwitter(username, limit);
          break;
      }
    })
  );

  return results;
}
