-- Voice DNA Database Schema for AWS RDS PostgreSQL
-- Run this script to create all necessary tables

-- ==========================================
-- User Posts Table
-- ==========================================
CREATE TABLE IF NOT EXISTS user_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  post_url TEXT,
  media_urls JSONB NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  caption TEXT,
  hashtags JSONB,
  visual_analysis JSONB,
  engagement JSONB,
  created_at TIMESTAMP NOT NULL,
  last_analyzed TIMESTAMP,
  UNIQUE(user_id, platform, post_id)
);

CREATE INDEX idx_user_posts_user_platform ON user_posts(user_id, platform);
CREATE INDEX idx_user_posts_created_at ON user_posts(created_at DESC);

-- ==========================================
-- Voice DNA Table
-- ==========================================
CREATE TABLE IF NOT EXISTS voice_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  dna_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_voice_dna_user_platform ON voice_dna(user_id, platform);

-- ==========================================
-- Voice DNA History Table
-- ==========================================
CREATE TABLE IF NOT EXISTS voice_dna_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  dna_snapshot JSONB NOT NULL,
  changes JSONB,
  trigger_type VARCHAR(100),
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_voice_dna_history_user ON voice_dna_history(user_id, platform, created_at DESC);

-- ==========================================
-- Generated Content Feedback Table
-- ==========================================
CREATE TABLE IF NOT EXISTS generated_content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  generated_content_id VARCHAR(255) NOT NULL,
  caption TEXT,
  hashtags JSONB,
  visual_guidelines JSONB,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  specific_issues JSONB,
  edited_version TEXT,
  used_in_post BOOLEAN DEFAULT false,
  voice_dna_version INTEGER,
  generation_prompt TEXT,
  visual_context TEXT,
  confidence_score DECIMAL(5,2),
  processed BOOLEAN DEFAULT false,
  applied_to_voice_dna BOOLEAN DEFAULT false,
  impact_score DECIMAL(5,2),
  created_at TIMESTAMP NOT NULL,
  processed_at TIMESTAMP
);

CREATE INDEX idx_feedback_user_platform ON generated_content_feedback(user_id, platform);
CREATE INDEX idx_feedback_processed ON generated_content_feedback(processed, created_at);

-- ==========================================
-- Learning Metrics Table
-- ==========================================
CREATE TABLE IF NOT EXISTS learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  total_generated INTEGER DEFAULT 0,
  thumbs_up_count INTEGER DEFAULT 0,
  thumbs_down_count INTEGER DEFAULT 0,
  satisfaction_rate DECIMAL(5,2),
  weekly_trends JSONB,
  improvement_data JSONB,
  usage_patterns JSONB,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_learning_metrics_user ON learning_metrics(user_id, platform);

-- ==========================================
-- Raw Scrapes Table (audit / debug)
-- ==========================================
CREATE TABLE IF NOT EXISTS raw_scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  username VARCHAR(255) NOT NULL,
  raw_response JSONB NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_scrapes_user ON raw_scrapes(user_id, platform, created_at DESC);

-- ==========================================
-- Comments for Documentation
-- ==========================================
COMMENT ON TABLE user_posts IS 'Stores scraped social media posts with visual analysis';
COMMENT ON TABLE voice_dna IS 'Stores the current Voice DNA profile for each user/platform';
COMMENT ON TABLE voice_dna_history IS 'Tracks historical changes to Voice DNA over time';
COMMENT ON TABLE generated_content_feedback IS 'Stores user feedback on AI-generated content';
COMMENT ON TABLE learning_metrics IS 'Tracks learning and improvement metrics per user';
COMMENT ON TABLE raw_scrapes IS 'Stores raw API responses from social media scrapers for audit/debug';
