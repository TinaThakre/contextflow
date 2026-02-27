// Database Service for Voice DNA
// Using Supabase PostgreSQL

import { createClient } from '@supabase/supabase-js';
import {
  StoredPost,
  VoiceDNA,
  GeneratedContentFeedback,
  LearningMetrics,
} from '@/types/voice-dna';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// Posts Management
// ==========================================

export async function savePost(post: Omit<StoredPost, 'id'>): Promise<StoredPost> {
  try {
    const { data, error } = await supabase
      .from('user_posts')
      .insert({
        user_id: post.userId,
        platform: post.platform,
        post_id: post.postId,
        post_url: post.postUrl,
        media_urls: post.mediaUrls,
        media_type: post.mediaType,
        caption: post.caption,
        hashtags: post.hashtags,
        visual_analysis: post.visualAnalysis,
        engagement: post.engagement,
        created_at: new Date(post.createdAt).toISOString(),
        last_analyzed: post.lastAnalyzed ? new Date(post.lastAnalyzed).toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return mapPostFromDB(data);
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
    let query = supabase
      .from('user_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapPostFromDB);
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
    const { error } = await supabase
      .from('user_posts')
      .update({
        visual_analysis: visualAnalysis,
        last_analyzed: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating post analysis:', error);
    throw new Error('Failed to update post analysis');
  }
}

export async function bulkSavePosts(posts: Omit<StoredPost, 'id'>[]): Promise<void> {
  try {
    const { error } = await supabase.from('user_posts').insert(
      posts.map((post) => ({
        user_id: post.userId,
        platform: post.platform,
        post_id: post.postId,
        post_url: post.postUrl,
        media_urls: post.mediaUrls,
        media_type: post.mediaType,
        caption: post.caption,
        hashtags: post.hashtags,
        visual_analysis: post.visualAnalysis,
        engagement: post.engagement,
        created_at: new Date(post.createdAt).toISOString(),
      }))
    );

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk saving posts:', error);
    throw new Error('Failed to bulk save posts');
  }
}

// ==========================================
// Voice DNA Management
// ==========================================

export async function saveVoiceDNA(voiceDNA: VoiceDNA): Promise<void> {
  try {
    const { error } = await supabase
      .from('voice_dna')
      .upsert({
        user_id: voiceDNA.userId,
        platform: voiceDNA.platform,
        dna_data: {
          coreIdentity: voiceDNA.coreIdentity,
          writingDNA: voiceDNA.writingDNA,
          visualDNA: voiceDNA.visualDNA,
          strategyDNA: voiceDNA.strategyDNA,
          behavioralDNA: voiceDNA.behavioralDNA,
          generationTemplates: voiceDNA.generationTemplates,
        },
        version: voiceDNA.version,
        confidence_score: voiceDNA.confidence.overallConfidence,
        created_at: new Date(voiceDNA.createdAt).toISOString(),
        updated_at: new Date(voiceDNA.lastUpdated).toISOString(),
      })
      .eq('user_id', voiceDNA.userId)
      .eq('platform', voiceDNA.platform);

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('voice_dna')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapVoiceDNAFromDB(data);
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
    const { error } = await supabase.from('voice_dna_history').insert({
      user_id: voiceDNA.userId,
      platform: voiceDNA.platform,
      version: voiceDNA.version,
      dna_snapshot: {
        coreIdentity: voiceDNA.coreIdentity,
        writingDNA: voiceDNA.writingDNA,
        visualDNA: voiceDNA.visualDNA,
        strategyDNA: voiceDNA.strategyDNA,
        behavioralDNA: voiceDNA.behavioralDNA,
        generationTemplates: voiceDNA.generationTemplates,
      },
      changes: changes || {},
      trigger_type: triggerType,
      satisfaction_rate: null,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('voice_dna_history')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
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
    const { data, error } = await supabase
      .from('generated_content_feedback')
      .insert({
        user_id: feedback.userId,
        platform: feedback.platform,
        generated_content_id: feedback.generatedContentId,
        caption: feedback.content.caption,
        hashtags: feedback.content.hashtags,
        visual_guidelines: feedback.content.visualGuidelines,
        rating: feedback.feedback.rating,
        specific_issues: feedback.feedback.specificIssues,
        edited_version: feedback.feedback.editedVersion,
        used_in_post: feedback.feedback.usedInPost,
        voice_dna_version: feedback.generationContext.voiceDNAVersion,
        generation_prompt: feedback.generationContext.prompt,
        visual_context: feedback.generationContext.visualContext,
        confidence_score: feedback.generationContext.confidenceScore,
        processed: feedback.learningData.processed,
        applied_to_voice_dna: feedback.learningData.appliedToVoiceDNA,
        impact_score: feedback.learningData.impactScore,
        created_at: new Date(feedback.feedback.timestamp).toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
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
    let query = supabase
      .from('generated_content_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapFeedbackFromDB);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw new Error('Failed to fetch feedback');
  }
}

export async function getUnprocessedFeedback(limit: number = 50): Promise<GeneratedContentFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('generated_content_feedback')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data.map(mapFeedbackFromDB);
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
    const { error } = await supabase
      .from('generated_content_feedback')
      .update({
        processed: true,
        applied_to_voice_dna: true,
        impact_score: impactScore,
        processed_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);

    if (error) throw error;
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
    const { error } = await supabase
      .from('learning_metrics')
      .upsert({
        user_id: userId,
        platform: platform,
        total_generated: metrics.feedbackStats?.totalGenerated,
        thumbs_up_count: metrics.feedbackStats?.thumbsUp,
        thumbs_down_count: metrics.feedbackStats?.thumbsDown,
        satisfaction_rate: metrics.feedbackStats?.satisfactionRate,
        weekly_trends: metrics.feedbackStats?.weeklyTrend,
        improvement_data: metrics.improvement,
        usage_patterns: metrics.usagePatterns,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('learning_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapLearningMetricsFromDB(data);
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
  return {
    id: data.id,
    userId: data.user_id,
    platform: data.platform,
    version: data.version,
    createdAt: new Date(data.created_at).getTime(),
    lastUpdated: new Date(data.updated_at).getTime(),
    ...data.dna_data,
    confidence: {
      overallConfidence: data.confidence_score,
      dataQuality: data.dna_data.confidence?.dataQuality || {
        sampleSize: 0,
        dateRange: 0,
        completeness: 0,
      },
      analysisDepth: data.dna_data.confidence?.analysisDepth || {
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
      hashtags: data.hashtags,
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
