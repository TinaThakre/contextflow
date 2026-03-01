// Database Service for Voice DNA
// Using PostgreSQL (AWS RDS)

import { Pool } from 'pg';
import {
  StoredPost,
  VoiceDNA,
  GeneratedContentFeedback,
  LearningMetrics,
} from '@/types/voice-dna';

// Strip sslmode from the connection string — we configure SSL explicitly below
// so the pg driver's sslmode parser doesn't fight with our rejectUnauthorized setting.
const rawUrl = process.env.DATABASE_URL ?? '';
const sanitizedUrl = rawUrl.replace(/[?&]sslmode=[^&]*/gi, '');

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: {
    rejectUnauthorized: false,   // accept AWS RDS self-signed certificate chain
  },
});

// Export pool for direct queries
export const db = pool;

// ==========================================
// Posts Management
// ==========================================

export async function savePost(post: Omit<StoredPost, 'id'>): Promise<StoredPost> {
  try {
    const result = await pool.query(
      `INSERT INTO user_posts (user_id, platform, post_id, post_url, media_urls, media_type, caption, hashtags, visual_analysis, engagement, created_at, last_analyzed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        post.userId,
        post.platform,
        post.postId,
        post.postUrl,
        JSON.stringify(post.mediaUrls),
        post.mediaType,
        post.caption,
        JSON.stringify(post.hashtags),
        JSON.stringify(post.visualAnalysis),
        JSON.stringify(post.engagement),
        new Date(post.createdAt).toISOString(),
        post.lastAnalyzed ? new Date(post.lastAnalyzed).toISOString() : null,
      ]
    );
    return mapPostFromDB(result.rows[0]);
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('Failed to save post');
  }
}

export async function getPostsByUser(
  userId: string,
  platform?: string,
  limit?: number
): Promise<StoredPost[]> {
  try {
    let query = 'SELECT * FROM user_posts WHERE user_id = $1';
    const params: any[] = [userId];

    if (platform) {
      query += ' AND platform = $2';
      params.push(platform);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await pool.query(query, params);
    return result.rows.map(mapPostFromDB);
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Failed to fetch posts');
  }
}

export async function updatePostAnalysis(
  postId: string,
  visualAnalysis: any
): Promise<void> {
  try {
    await pool.query(
      'UPDATE user_posts SET visual_analysis = $1, last_analyzed = $2 WHERE id = $3',
      [JSON.stringify(visualAnalysis), new Date().toISOString(), postId]
    );
  } catch (error) {
    console.error('Error updating post analysis:', error);
    throw new Error('Failed to update post analysis');
  }
}

/**
 * Idempotent bulk-insert: ON CONFLICT (user_id, platform, post_id) DO NOTHING.
 * Safe to call repeatedly with the same data from retried scrapes.
 */
export async function bulkSavePosts(posts: Omit<StoredPost, 'id'>[]): Promise<void> {
  if (posts.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const post of posts) {
      await client.query(
        `INSERT INTO user_posts (user_id, platform, post_id, post_url, media_urls, media_type, caption, hashtags, visual_analysis, engagement, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id, platform, post_id) DO NOTHING`,
        [
          post.userId,
          post.platform,
          post.postId,
          post.postUrl,
          JSON.stringify(post.mediaUrls),
          post.mediaType,
          post.caption,
          JSON.stringify(post.hashtags),
          JSON.stringify(post.visualAnalysis),
          JSON.stringify(post.engagement),
          new Date(post.createdAt).toISOString(),
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk saving posts:', error);
    throw new Error('Failed to bulk save posts');
  } finally {
    client.release();
  }
}

// ==========================================
// Raw Scrape Audit Log
// ==========================================

/**
 * Save the raw RapidAPI response for audit/debug.
 * This is append-only — every scrape creates a new row.
 */
export async function saveRawScrape(
  userId: string,
  platform: string,
  username: string,
  rawResponse: unknown,
  postCount: number,
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO raw_scrapes (user_id, platform, username, raw_response, post_count, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [userId, platform, username, JSON.stringify(rawResponse), postCount],
  );
  return result.rows[0].id;
}

// ==========================================
// Voice DNA Management
// ==========================================

export async function saveVoiceDNA(voiceDNA: VoiceDNA): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO voice_dna (user_id, platform, dna_data, version, confidence_score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, platform) DO UPDATE SET
         dna_data = EXCLUDED.dna_data,
         version = EXCLUDED.version,
         confidence_score = EXCLUDED.confidence_score,
         updated_at = EXCLUDED.updated_at`,
      [
        voiceDNA.userId,
        voiceDNA.platform,
        JSON.stringify({
          coreIdentity: voiceDNA.coreIdentity,
          writingDNA: voiceDNA.writingDNA,
          visualDNA: voiceDNA.visualDNA,
          strategyDNA: voiceDNA.strategyDNA,
          behavioralDNA: voiceDNA.behavioralDNA,
          generationTemplates: voiceDNA.generationTemplates,
        }),
        voiceDNA.version,
        voiceDNA.confidence.overallConfidence,
        new Date(voiceDNA.createdAt).toISOString(),
        new Date(voiceDNA.lastUpdated).toISOString(),
      ]
    );

    // Save to history
    await saveVoiceDNAHistory(voiceDNA, 'auto_update');
  } catch (error) {
    console.error('Error saving Voice DNA:', error);
    throw new Error('Failed to save Voice DNA');
  }
}

export async function getVoiceDNA(
  userId: string,
  platform: string
): Promise<VoiceDNA | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM voice_dna WHERE user_id = $1 AND platform = $2',
      [userId, platform]
    );

    if (result.rows.length === 0) return null;
    return mapVoiceDNAFromDB(result.rows[0]);
  } catch (error) {
    console.error('Error fetching Voice DNA:', error);
    throw new Error('Failed to fetch Voice DNA');
  }
}

export async function saveVoiceDNAHistory(
  voiceDNA: VoiceDNA,
  triggerType: string,
  changes?: any
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO voice_dna_history (user_id, platform, version, dna_snapshot, changes, trigger_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        voiceDNA.userId,
        voiceDNA.platform,
        voiceDNA.version,
        JSON.stringify({
          coreIdentity: voiceDNA.coreIdentity,
          writingDNA: voiceDNA.writingDNA,
          visualDNA: voiceDNA.visualDNA,
          strategyDNA: voiceDNA.strategyDNA,
          behavioralDNA: voiceDNA.behavioralDNA,
          generationTemplates: voiceDNA.generationTemplates,
        }),
        JSON.stringify(changes || {}),
        triggerType,
        new Date().toISOString(),
      ]
    );
  } catch (error) {
    console.error('Error saving Voice DNA history:', error);
    // Don't throw - history failure shouldn't break the flow
  }
}

export async function getVoiceDNAHistory(
  userId: string,
  platform: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM voice_dna_history WHERE user_id = $1 AND platform = $2 ORDER BY created_at DESC LIMIT $3',
      [userId, platform, limit]
    );
    return result.rows || [];
  } catch (error) {
    console.error('Error fetching Voice DNA history:', error);
    return [];
  }
}

// ==========================================
// Feedback Management
// ==========================================

export async function saveFeedback(
  feedback: Omit<GeneratedContentFeedback, 'id'>
): Promise<string> {
  try {
    const result = await pool.query(
      `INSERT INTO generated_content_feedback 
       (user_id, platform, generated_content_id, caption, hashtags, visual_guidelines, rating, specific_issues, edited_version, used_in_post, voice_dna_version, generation_prompt, visual_context, confidence_score, processed, applied_to_voice_dna, impact_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        feedback.userId,
        feedback.platform,
        feedback.generatedContentId,
        feedback.content.caption,
        JSON.stringify(feedback.content.hashtags),
        JSON.stringify(feedback.content.visualGuidelines),
        feedback.feedback.rating,
        JSON.stringify(feedback.feedback.specificIssues),
        feedback.feedback.editedVersion,
        feedback.feedback.usedInPost,
        feedback.generationContext.voiceDNAVersion,
        feedback.generationContext.prompt,
        feedback.generationContext.visualContext,
        feedback.generationContext.confidenceScore,
        feedback.learningData.processed,
        feedback.learningData.appliedToVoiceDNA,
        feedback.learningData.impactScore,
        new Date(feedback.feedback.timestamp).toISOString(),
      ]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw new Error('Failed to save feedback');
  }
}

export async function getFeedbackByUser(
  userId: string,
  platform?: string,
  limit?: number
): Promise<GeneratedContentFeedback[]> {
  try {
    let query = 'SELECT * FROM generated_content_feedback WHERE user_id = $1';
    const params: any[] = [userId];

    if (platform) {
      query += ' AND platform = $2';
      params.push(platform);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await pool.query(query, params);
    return result.rows.map(mapFeedbackFromDB);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw new Error('Failed to fetch feedback');
  }
}

export async function getUnprocessedFeedback(limit: number = 50): Promise<GeneratedContentFeedback[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM generated_content_feedback WHERE processed = false ORDER BY created_at ASC LIMIT $1',
      [limit]
    );
    return result.rows.map(mapFeedbackFromDB);
  } catch (error) {
    console.error('Error fetching unprocessed feedback:', error);
    return [];
  }
}

export async function markFeedbackProcessed(
  feedbackId: string,
  impactScore: number
): Promise<void> {
  try {
    await pool.query(
      'UPDATE generated_content_feedback SET processed = true, applied_to_voice_dna = true, impact_score = $1, processed_at = $2 WHERE id = $3',
      [impactScore, new Date().toISOString(), feedbackId]
    );
  } catch (error) {
    console.error('Error marking feedback processed:', error);
    throw new Error('Failed to mark feedback processed');
  }
}

// ==========================================
// Learning Metrics Management
// ==========================================

export async function updateLearningMetrics(
  userId: string,
  platform: string,
  metrics: Partial<LearningMetrics>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO learning_metrics (user_id, platform, total_generated, thumbs_up_count, thumbs_down_count, satisfaction_rate, weekly_trends, improvement_data, usage_patterns, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, platform) DO UPDATE SET
         total_generated = EXCLUDED.total_generated,
         thumbs_up_count = EXCLUDED.thumbs_up_count,
         thumbs_down_count = EXCLUDED.thumbs_down_count,
         satisfaction_rate = EXCLUDED.satisfaction_rate,
         weekly_trends = EXCLUDED.weekly_trends,
         improvement_data = EXCLUDED.improvement_data,
         usage_patterns = EXCLUDED.usage_patterns,
         updated_at = EXCLUDED.updated_at`,
      [
        userId,
        platform,
        metrics.feedbackStats?.totalGenerated,
        metrics.feedbackStats?.thumbsUp,
        metrics.feedbackStats?.thumbsDown,
        metrics.feedbackStats?.satisfactionRate,
        JSON.stringify(metrics.feedbackStats?.weeklyTrend || []),
        JSON.stringify(metrics.improvement),
        JSON.stringify(metrics.usagePatterns),
        new Date().toISOString(),
      ]
    );
  } catch (error) {
    console.error('Error updating learning metrics:', error);
    throw new Error('Failed to update learning metrics');
  }
}

export async function getLearningMetrics(
  userId: string,
  platform: string
): Promise<LearningMetrics | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM learning_metrics WHERE user_id = $1 AND platform = $2',
      [userId, platform]
    );

    if (result.rows.length === 0) return null;
    return mapLearningMetricsFromDB(result.rows[0]);
  } catch (error) {
    console.error('Error fetching learning metrics:', error);
    return null;
  }
}

// ==========================================
// Helper Functions - DB Mapping
// ==========================================

function mapPostFromDB(data: any): StoredPost {
  return {
    id: data.id,
    userId: data.user_id,
    platform: data.platform,
    postId: data.post_id,
    postUrl: data.post_url,
    mediaUrls: data.media_urls,
    mediaType: data.media_type,
    caption: data.caption,
    hashtags: data.hashtags,
    visualAnalysis: data.visual_analysis,
    engagement: data.engagement,
    createdAt: new Date(data.created_at).getTime(),
    lastAnalyzed: data.last_analyzed ? new Date(data.last_analyzed).getTime() : undefined,
  };
}

function mapVoiceDNAFromDB(data: any): VoiceDNA {
  const dnaData = typeof data.dna_data === 'string' ? JSON.parse(data.dna_data) : data.dna_data;
  return {
    id: data.id,
    userId: data.user_id,
    platform: data.platform,
    version: data.version,
    createdAt: new Date(data.created_at).getTime(),
    lastUpdated: new Date(data.updated_at).getTime(),
    ...dnaData,
    confidence: {
      overallConfidence: data.confidence_score,
      dataQuality: dnaData.confidence?.dataQuality || {
        sampleSize: 0,
        dateRange: 0,
        completeness: 0,
      },
      analysisDepth: dnaData.confidence?.analysisDepth || {
        textualAnalysis: 0,
        visualAnalysis: 0,
        correlationAnalysis: 0,
      },
    },
  };
}

function mapFeedbackFromDB(data: any): GeneratedContentFeedback {
  return {
    id: data.id,
    userId: data.user_id,
    platform: data.platform,
    generatedContentId: data.generated_content_id,
    content: {
      caption: data.caption,
      hashtags: typeof data.hashtags === 'string' ? JSON.parse(data.hashtags) : data.hashtags,
      visualGuidelines: data.visual_guidelines,
    },
    feedback: {
      rating: data.rating,
      timestamp: new Date(data.created_at).getTime(),
      specificIssues: data.specific_issues,
      editedVersion: data.edited_version,
      usedInPost: data.used_in_post,
    },
    generationContext: {
      voiceDNAVersion: data.voice_dna_version,
      prompt: data.generation_prompt,
      visualContext: data.visual_context,
      confidenceScore: data.confidence_score,
    },
    learningData: {
      processed: data.processed,
      appliedToVoiceDNA: data.applied_to_voice_dna,
      impactScore: data.impact_score,
    },
  };
}

function mapLearningMetricsFromDB(data: any): LearningMetrics {
  return {
    userId: data.user_id,
    platform: data.platform,
    feedbackStats: {
      totalGenerated: data.total_generated,
      thumbsUp: data.thumbs_up_count,
      thumbsDown: data.thumbs_down_count,
      satisfactionRate: data.satisfaction_rate,
      weeklyTrend: data.weekly_trends || [],
    },
    improvement: data.improvement_data || {
      initialSatisfactionRate: 0,
      currentSatisfactionRate: 0,
      improvementPercentage: 0,
      improvedAspects: [],
    },
    usagePatterns: data.usage_patterns || {
      generationsPerWeek: 0,
      mostGeneratedContentType: '',
      peakUsageTimes: [],
      actualPostUsageRate: 0,
    },
  };
}
