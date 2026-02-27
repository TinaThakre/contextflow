// Voice DNA Service - Core Business Logic

import { VoiceDNA, StoredPost, GeneratedContent } from '@/types/voice-dna';
import {
  analyzeVisualContent,
  analyzeTextWithBedrock,
  synthesizeVoiceDNA,
  generateContentWithBedrock,
} from './aws-services';
import {
  savePost,
  getPostsByUser,
  saveVoiceDNA,
  getVoiceDNA,
  updatePostAnalysis,
  bulkSavePosts,
} from './database';

// ==========================================
// Voice DNA Creation
// ==========================================

export async function createVoiceDNA(
  userId: string,
  platform: 'instagram' | 'twitter' | 'linkedin',
  posts: any[]
): Promise<VoiceDNA> {
  try {
    console.log(`Creating Voice DNA for user ${userId} on ${platform}`);

    // Step 1: Save posts to database
    const storedPosts: Omit<StoredPost, 'id'>[] = posts.map((post) => ({
      userId,
      platform,
      postId: post.id || post.pk,
      postUrl: post.postUrl || `https://instagram.com/p/${post.code}`,
      mediaUrls: extractMediaUrls(post),
      mediaType: determineMediaType(post),
      caption: post.caption?.text || '',
      hashtags: extractHashtags(post.caption?.text || ''),
      engagement: {
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        viewCount: post.view_count,
      },
      createdAt: post.taken_at ? post.taken_at * 1000 : Date.now(),
    }));

    await bulkSavePosts(storedPosts);

    // Step 2: Analyze visual content (parallel processing)
    console.log('Analyzing visual content...');
    const visualAnalysisPromises = storedPosts
      .filter((post) => post.mediaUrls.length > 0)
      .slice(0, 20) // Limit to 20 posts for cost optimization
      .map(async (post) => {
        try {
          const analysis = await analyzeVisualContent(
            post.mediaUrls[0],
            post.caption
          );
          return { postId: post.postId, analysis };
        } catch (error) {
          console.error(`Failed to analyze post ${post.postId}:`, error);
          return null;
        }
      });

    const visualAnalysisResults = await Promise.all(visualAnalysisPromises);

    // Update posts with visual analysis
    for (const result of visualAnalysisResults) {
      if (result) {
        const dbPost = await getPostsByUser(userId, platform);
        const post = dbPost.find((p) => p.postId === result.postId);
        if (post) {
          await updatePostAnalysis(post.id, result.analysis);
        }
      }
    }

    // Step 3: Fetch updated posts with analysis
    const analyzedPosts = await getPostsByUser(userId, platform);

    // Step 4: Analyze textual patterns
    console.log('Analyzing textual patterns...');
    const textAnalysis = await analyzeTextualPatterns(analyzedPosts);

    // Step 5: Analyze visual patterns
    console.log('Analyzing visual patterns...');
    const visualAnalysis = await analyzeVisualPatterns(analyzedPosts);

    // Step 6: Correlate content
    console.log('Correlating content patterns...');
    const correlation = await correlateContentPatterns(
      textAnalysis,
      visualAnalysis,
      analyzedPosts
    );

    // Step 7: Analyze engagement
    console.log('Analyzing engagement patterns...');
    const engagement = await analyzeEngagementPatterns(analyzedPosts);

    // Step 8: Synthesize Voice DNA
    console.log('Synthesizing Voice DNA...');
    const dnaData = await synthesizeVoiceDNA(
      analyzedPosts,
      textAnalysis,
      visualAnalysis,
      correlation,
      engagement
    );

    // Step 9: Calculate confidence scores
    const confidence = calculateConfidenceScores(analyzedPosts, dnaData);

    // Step 10: Create Voice DNA object
    const voiceDNA: VoiceDNA = {
      id: `${userId}_${platform}_${Date.now()}`,
      userId,
      platform,
      version: '1.0.0',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      ...dnaData,
      confidence,
    };

    // Step 11: Save Voice DNA
    await saveVoiceDNA(voiceDNA);

    console.log('Voice DNA created successfully');
    return voiceDNA;
  } catch (error) {
    console.error('Error creating Voice DNA:', error);
    throw new Error('Failed to create Voice DNA');
  }
}

// ==========================================
// Content Generation
// ==========================================

export async function generateContent(
  userId: string,
  platform: 'instagram' | 'twitter' | 'linkedin',
  context: string,
  contentType: 'caption' | 'hashtags' | 'full' = 'full'
): Promise<GeneratedContent> {
  try {
    // Get Voice DNA
    const voiceDNA = await getVoiceDNA(userId, platform);
    
    if (!voiceDNA) {
      throw new Error('Voice DNA not found. Please create Voice DNA first.');
    }

    // Generate content
    const generated = await generateContentWithBedrock(
      voiceDNA,
      context,
      contentType
    );

    return {
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      caption: generated.caption || '',
      hashtags: generated.hashtags || [],
      visualGuidelines: voiceDNA.generationTemplates.visualGuidelines,
      metadata: {
        voiceDNAVersion: voiceDNA.version,
        confidenceScore: voiceDNA.confidence.overallConfidence,
        generatedAt: Date.now(),
      },
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content');
  }
}

// ==========================================
// Analysis Functions
// ==========================================

async function analyzeTextualPatterns(posts: StoredPost[]): Promise<any> {
  try {
    const captions = posts.map((p) => p.caption).filter(Boolean);
    const allText = captions.join('\n\n');

    // Analyze with Bedrock
    const analysis = await analyzeTextWithBedrock(allText, 'social media posts');

    // Extract hashtag patterns
    const allHashtags = posts.flatMap((p) => p.hashtags);
    const hashtagFrequency = countFrequency(allHashtags);

    return {
      ...analysis,
      hashtagStrategy: {
        avgHashtagsPerPost: allHashtags.length / posts.length,
        topHashtags: Object.entries(hashtagFrequency)
          .map(([tag, count]) => ({
            tag,
            usage: count as number,
            avgEngagement: calculateAvgEngagement(posts, tag),
          }))
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 20),
      },
    };
  } catch (error) {
    console.error('Error analyzing textual patterns:', error);
    return {};
  }
}

async function analyzeVisualPatterns(posts: StoredPost[]): Promise<any> {
  try {
    const postsWithAnalysis = posts.filter((p) => p.visualAnalysis);

    if (postsWithAnalysis.length === 0) {
      return {
        visualStyle: {
          colorPalette: { primary: [], secondary: [], mood: 'neutral' },
          compositionStyle: { framing: [], perspective: [], lighting: [] },
          contentTypes: {},
        },
        visualThemes: {
          recurringElements: [],
          aestheticStyle: 'varied',
          brandingConsistency: 0,
        },
      };
    }

    // Aggregate colors
    const allColors = postsWithAnalysis.flatMap(
      (p) => p.visualAnalysis?.dominantColors || []
    );
    const colorFrequency = countFrequency(allColors);
    const topColors = Object.keys(colorFrequency)
      .sort((a, b) => colorFrequency[b] - colorFrequency[a])
      .slice(0, 5);

    // Aggregate objects/themes
    const allObjects = postsWithAnalysis.flatMap(
      (p) => p.visualAnalysis?.detectedObjects || []
    );
    const objectFrequency = countFrequency(allObjects);

    // Aggregate moods
    const allMoods = postsWithAnalysis.map((p) => p.visualAnalysis?.mood || '');
    const moodFrequency = countFrequency(allMoods);
    const dominantMood = Object.keys(moodFrequency).sort(
      (a, b) => moodFrequency[b] - moodFrequency[a]
    )[0];

    return {
      visualStyle: {
        colorPalette: {
          primary: topColors.slice(0, 3),
          secondary: topColors.slice(3, 5),
          mood: dominantMood,
        },
        compositionStyle: {
          framing: ['center-focused'],
          perspective: ['eye-level'],
          lighting: ['natural'],
        },
        contentTypes: objectFrequency,
      },
      visualThemes: {
        recurringElements: Object.keys(objectFrequency).slice(0, 10),
        aestheticStyle: dominantMood,
        brandingConsistency: calculateBrandingConsistency(postsWithAnalysis),
      },
    };
  } catch (error) {
    console.error('Error analyzing visual patterns:', error);
    return {};
  }
}

async function correlateContentPatterns(
  textAnalysis: any,
  visualAnalysis: any,
  posts: StoredPost[]
): Promise<any> {
  try {
    // Calculate caption-visual alignment
    const alignmentScores = posts
      .filter((p) => p.visualAnalysis)
      .map((post) => {
        const captionThemes = extractThemes(post.caption);
        const visualThemes = post.visualAnalysis?.visualThemes || [];
        const overlap = captionThemes.filter((t) => visualThemes.includes(t));
        return overlap.length / Math.max(captionThemes.length, 1);
      });

    const avgAlignment =
      alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length || 0;

    return {
      captionVisualAlignment: {
        overallScore: avgAlignment,
        patterns: [],
      },
      hashtagVisualMatch: {
        effectivePatterns: [],
      },
      contentFormula: {
        highPerformingCombinations: findHighPerformingCombinations(posts),
      },
    };
  } catch (error) {
    console.error('Error correlating content patterns:', error);
    return {};
  }
}

async function analyzeEngagementPatterns(posts: StoredPost[]): Promise<any> {
  try {
    const totalLikes = posts.reduce((sum, p) => sum + p.engagement.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.engagement.comments, 0);

    const avgLikes = totalLikes / posts.length;
    const avgComments = totalComments / posts.length;

    // Find best performing posts
    const sortedByEngagement = [...posts].sort(
      (a, b) =>
        b.engagement.likes +
        b.engagement.comments -
        (a.engagement.likes + a.engagement.comments)
    );

    return {
      performanceMetrics: {
        avgLikes,
        avgComments,
        engagementRate: (avgLikes + avgComments) / posts.length,
        bestPerformingPosts: sortedByEngagement.slice(0, 5).map((p) => p.id),
      },
      timingPatterns: {
        bestPostingTimes: ['9:00 AM', '6:00 PM'],
        postingFrequency: posts.length / 30, // posts per day
        consistencyScore: 0.8,
      },
      audienceResonance: {
        topPerformingTopics: [],
        topPerformingVisualStyles: [],
        topPerformingHashtags: [],
      },
    };
  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    return {};
  }
}

// ==========================================
// Helper Functions
// ==========================================

function extractMediaUrls(post: any): string[] {
  const urls: string[] = [];

  // Handle video
  if (post.video_versions && post.video_versions.length > 0) {
    urls.push(post.video_versions[0].url);
  }

  // Handle images
  if (post.image_versions2?.candidates && post.image_versions2.candidates.length > 0) {
    urls.push(post.image_versions2.candidates[0].url);
  }

  // Handle carousel
  if (post.carousel_media) {
    for (const media of post.carousel_media) {
      if (media.image_versions2?.candidates?.[0]?.url) {
        urls.push(media.image_versions2.candidates[0].url);
      }
    }
  }

  return urls;
}

function determineMediaType(post: any): 'image' | 'video' | 'carousel' {
  if (post.carousel_media) return 'carousel';
  if (post.video_versions) return 'video';
  return 'image';
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.toLowerCase()) : [];
}

function countFrequency(items: string[]): { [key: string]: number } {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
}

function calculateAvgEngagement(posts: StoredPost[], hashtag: string): number {
  const postsWithHashtag = posts.filter((p) => p.hashtags.includes(hashtag));
  if (postsWithHashtag.length === 0) return 0;

  const totalEngagement = postsWithHashtag.reduce(
    (sum, p) => sum + p.engagement.likes + p.engagement.comments,
    0
  );

  return totalEngagement / postsWithHashtag.length;
}

function calculateBrandingConsistency(posts: StoredPost[]): number {
  // Simplified: check color consistency
  const allColors = posts.flatMap((p) => p.visualAnalysis?.dominantColors || []);
  const uniqueColors = new Set(allColors);
  return 1 - uniqueColors.size / allColors.length;
}

function extractThemes(text: string): string[] {
  // Simplified theme extraction
  const words = text.toLowerCase().split(/\s+/);
  return words.filter((w) => w.length > 5);
}

function findHighPerformingCombinations(posts: StoredPost[]): any[] {
  // Find posts with above-average engagement
  const avgEngagement =
    posts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments, 0) /
    posts.length;

  return posts
    .filter((p) => p.engagement.likes + p.engagement.comments > avgEngagement)
    .slice(0, 5)
    .map((p) => ({
      visualStyle: p.visualAnalysis?.mood || 'unknown',
      captionApproach: p.caption.length > 100 ? 'detailed' : 'concise',
      hashtags: p.hashtags.slice(0, 5),
      timing: 'optimal',
      expectedPerformance: p.engagement.likes + p.engagement.comments,
 
    }));
}

function calculateConfidenceScores(posts: StoredPost[], dnaData: any): any {
  const sampleSize = posts.length;
  const dateRange = calculateDateRange(posts);
  const completeness = calculateCompleteness(posts);

  const dataQuality = {
    sampleSize,
    dateRange,
    completeness,
  };

  const analysisDepth = {
    textualAnalysis: posts.filter((p) => p.caption).length / sampleSize,
    visualAnalysis: posts.filter((p) => p.visualAnalysis).length / sampleSize,
    correlationAnalysis: 0.8, // Placeholder
  };

  // Calculate overall confidence
  const sampleScore = Math.min(sampleSize / 50, 1); // Ideal: 50+ posts
  const dateScore = Math.min(dateRange / 90, 1); // Ideal: 90+ days
  const completenessScore = completeness;
  const analysisScore =
    (analysisDepth.textualAnalysis +
      analysisDepth.visualAnalysis +
      analysisDepth.correlationAnalysis) /
    3;

  const overallConfidence =
    (sampleScore + dateScore + completenessScore + analysisScore) / 4;

  return {
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    dataQuality,
    analysisDepth,
  };
}

function calculateDateRange(posts: StoredPost[]): number {
  if (posts.length === 0) return 0;

  const timestamps = posts.map((p) => p.createdAt);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);

  return Math.floor((newest - oldest) / (1000 * 60 * 60 * 24)); // days
}

function calculateCompleteness(posts: StoredPost[]): number {
  if (posts.length === 0) return 0;

  const withCaption = posts.filter((p) => p.caption).length;
  const withHashtags = posts.filter((p) => p.hashtags.length > 0).length;
  const withMedia = posts.filter((p) => p.mediaUrls.length > 0).length;
  const withAnalysis = posts.filter((p) => p.visualAnalysis).length;

  return (
    (withCaption + withHashtags + withMedia + withAnalysis) /
    (posts.length * 4)
  );
}
