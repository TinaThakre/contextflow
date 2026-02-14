# Requirements Document: ContextFlow AI

## Introduction

ContextFlow AI is an intelligent content creation platform that learns a creator's unique writing style from their historical posts and generates personalized, trend-aware content optimized for multiple social media platforms. Unlike generic AI writing tools that produce robotic content, ContextFlow AI preserves the creator's authentic voice while incorporating real-time trend intelligence and platform-specific optimization.

The system addresses the core problem of content creators spending hours researching trends and rewriting content for different platforms by automating voice analysis, trend discovery, and multi-platform content adaptation while maintaining the creator's unique style and authenticity.

## Glossary

- **Voice_DNA**: A computational representation of a creator's unique writing style derived from analyzing their historical content, including tone, vocabulary, sentence structure, and thematic patterns
- **Content_Generator**: The AI-powered system component that produces new content based on Voice_DNA and trend intelligence
- **Trend_Intelligence_Engine**: The system that aggregates and analyzes real-time trends from multiple sources (Google Trends, Reddit, NewsAPI, social platforms)
- **Platform_Optimizer**: The component that adapts content for specific social media platform requirements (character limits, hashtag strategies, formatting)
- **Engagement_Predictor**: The scoring algorithm that estimates content performance based on historical data and trend relevance
- **RAG_Pipeline**: Retrieval-Augmented Generation pipeline that combines vector search with LLM generation for contextually relevant content
- **Voice_Learning_System**: The ML subsystem that ingests user content, extracts style patterns, and creates embeddings for similarity matching
- **Multi_Provider_Router**: The circuit breaker system that routes AI requests across multiple providers (Vertex AI, Claude) with automatic fallback
- **Content_Ingestion_Pipeline**: The workflow that imports, processes, and vectorizes user's historical content from various sources
- **Authentication_System**: OAuth-based user authentication with JWT token management via Supabase
- **Rate_Limiter**: Redis-based request throttling system to prevent API abuse and manage costs
- **Background_Job_Processor**: QStash-powered asynchronous task execution system for long-running operations
- **Vector_Store**: Pinecone database storing content embeddings with metadata for semantic search
- **Optimization_Score**: A numerical metric (0-100) predicting content engagement potential based on multiple factors

## Requirements

### Requirement 1: User Authentication and Onboarding

**User Story:** As a content creator, I want to securely sign up and connect my social media accounts, so that the system can learn my writing style and manage my content across platforms.

#### Acceptance Criteria

1. WHEN a new user visits the platform, THE Authentication_System SHALL provide OAuth login options for Google, LinkedIn, and email/password
2. WHEN a user completes OAuth authentication, THE Authentication_System SHALL create a user profile in Supabase and issue a JWT token valid for 7 days
3. WHEN a user connects a social media account, THE Content_Ingestion_Pipeline SHALL request permission to read historical posts (minimum 20 posts required)
4. WHEN insufficient historical content is available, THE System SHALL prompt the user to manually upload content samples or provide writing examples
5. WHEN a user completes onboarding, THE System SHALL initiate Voice_DNA analysis as a background job and notify the user when complete (estimated 2-5 minutes)
6. THE Authentication_System SHALL enforce rate limiting of 5 login attempts per IP address per 15 minutes
7. WHEN a user's JWT token expires, THE System SHALL automatically refresh the token if a valid refresh token exists

### Requirement 2: Content Ingestion and Voice DNA Analysis

**User Story:** As a content creator, I want the system to analyze my past posts and learn my unique writing style, so that generated content sounds authentically like me.

#### Acceptance Criteria

1. WHEN a user authorizes content access, THE Content_Ingestion_Pipeline SHALL fetch historical posts from connected platforms using RapidAPI scrapers (Instagram, Twitter) and Proxycurl (LinkedIn)
2. WHEN content is fetched, THE System SHALL extract text, metadata (engagement metrics, timestamps, hashtags), and associated images
3. THE Voice_Learning_System SHALL process minimum 20 posts and maximum 500 posts per platform to create Voice_DNA
4. WHEN analyzing content, THE Voice_Learning_System SHALL extract tone patterns (formal, casual, humorous, professional), vocabulary preferences, sentence length distribution, and thematic topics
5. THE System SHALL generate embeddings using Google text-embedding-004 model and store vectors in Pinecone with metadata (platform, engagement_score, timestamp)
6. WHEN Voice_DNA analysis completes, THE System SHALL generate a human-readable style summary showing detected tone, common themes, and platform-specific patterns
7. THE Voice_Learning_System SHALL update Voice_DNA incrementally when new user content is added (feedback loop)
8. IF content ingestion fails for a platform, THEN THE System SHALL log the error, notify the user, and continue processing other platforms

### Requirement 3: Trend Intelligence and Discovery

**User Story:** As a content creator, I want to discover relevant trending topics in my niche, so that my content stays current and reaches wider audiences.

#### Acceptance Criteria

1. THE Trend_Intelligence_Engine SHALL aggregate trends from Google Trends API, Reddit API (top posts in relevant subreddits), and NewsAPI every 6 hours
2. WHEN a user specifies interest categories during onboarding, THE System SHALL filter trends to match those categories (technology, marketing, lifestyle, business, etc.)
3. WHEN displaying trends, THE System SHALL show trend title, source, velocity score (rising/stable/declining), and relevance score (0-100) to user's Voice_DNA
4. THE Trend_Intelligence_Engine SHALL use semantic similarity search to match trends against user's historical content themes
5. WHEN a trend is selected, THE System SHALL provide context including key talking points, related hashtags, and engagement statistics
6. THE System SHALL cache trend data in Upstash Redis for 6 hours to minimize API calls
7. WHEN trend APIs are unavailable, THE System SHALL serve cached data and display a staleness indicator

### Requirement 4: AI-Powered Content Generation

**User Story:** As a content creator, I want to generate platform-specific content that matches my writing style and incorporates trending topics, so that I can maintain consistent posting without spending hours writing.

#### Acceptance Criteria

1. WHEN a user requests content generation, THE Content_Generator SHALL accept inputs: target platform, optional trend selection, optional topic/prompt, and desired tone adjustment
2. THE Content_Generator SHALL use RAG_Pipeline to retrieve 5-10 most similar past posts from Vector_Store based on topic similarity
3. THE Content_Generator SHALL construct a prompt including Voice_DNA summary, retrieved examples, trend context (if selected), and platform-specific guidelines
4. THE Multi_Provider_Router SHALL send requests to Google Vertex AI Gemini 2.5 Pro as primary provider with 10-second timeout
5. IF Vertex AI fails or times out, THEN THE Multi_Provider_Router SHALL automatically retry with Anthropic Claude Sonnet with 10-second timeout
6. IF both providers fail, THEN THE System SHALL return an error message and log the failure for monitoring
7. THE Content_Generator SHALL generate content adhering to platform constraints: Instagram (2,200 chars, hashtag strategy), LinkedIn (3,000 chars, professional tone), Twitter/X (280 chars, thread support), Threads (500 chars)
8. WHEN content is generated, THE Platform_Optimizer SHALL suggest optimal posting time based on user's historical engagement patterns
9. THE System SHALL generate 3 content variations per request to provide user choice
10. THE Engagement_Predictor SHALL score each variation (0-100) based on trend relevance, Voice_DNA match, and platform best practices

### Requirement 5: Content Optimization and Scheduling

**User Story:** As a content creator, I want to optimize my content for maximum engagement and schedule posts across platforms, so that I can maintain consistent presence without manual posting.

#### Acceptance Criteria

1. WHEN content is generated, THE Platform_Optimizer SHALL analyze and suggest improvements: hashtag recommendations (3-5 for Instagram, 1-2 for LinkedIn), emoji placement, call-to-action phrasing, and readability score
2. THE System SHALL allow users to edit generated content with real-time character count and platform constraint validation
3. WHEN a user approves content, THE System SHALL provide scheduling options: post immediately, schedule for specific time, or add to content calendar
4. THE System SHALL store scheduled posts in Supabase with status (draft, scheduled, published, failed)
5. THE Background_Job_Processor SHALL execute scheduled posts via QStash at specified times with retry logic (3 attempts with exponential backoff)
6. WHEN posting to platforms, THE System SHALL use official APIs where available (LinkedIn) and RapidAPI posting services for Instagram/Twitter with user consent
7. IF posting fails, THEN THE System SHALL notify the user via email (Resend) and in-app notification with error details
8. THE System SHALL track post performance metrics (likes, comments, shares, impressions) when available from platform APIs

### Requirement 6: Multi-Platform Content Adaptation

**User Story:** As a content creator, I want to adapt a single content idea across multiple platforms simultaneously, so that I can maintain cross-platform presence efficiently.

#### Acceptance Criteria

1. WHEN a user selects "Create for All Platforms" mode, THE Content_Generator SHALL generate platform-specific variations from a single topic/prompt
2. THE Platform_Optimizer SHALL adapt content length: full-form for LinkedIn, concise for Twitter, visual-focused for Instagram, conversational for Threads
3. THE System SHALL maintain core message consistency while adjusting tone and format per platform (professional for LinkedIn, casual for Instagram)
4. WHEN generating cross-platform content, THE System SHALL suggest platform-specific media: infographic for LinkedIn, carousel for Instagram, thread structure for Twitter
5. THE System SHALL allow bulk scheduling across platforms with platform-specific optimal times
6. WHEN one platform's content is edited, THE System SHALL offer to propagate changes to other platform variations with appropriate adaptations

### Requirement 7: User Feedback and Learning Loop

**User Story:** As a content creator, I want to provide feedback on generated content quality, so that the system continuously improves and better matches my style over time.

#### Acceptance Criteria

1. WHEN content is generated, THE System SHALL provide feedback options: thumbs up/down, style match rating (1-5 stars), and optional text feedback
2. WHEN a user provides negative feedback, THE System SHALL prompt for specific issues: tone mismatch, factual errors, platform inappropriateness, or generic phrasing
3. THE Voice_Learning_System SHALL store feedback with associated content embeddings and use it to fine-tune future generation prompts
4. WHEN a user publishes content (with or without edits), THE System SHALL treat the final version as a positive training example and add it to Voice_DNA
5. THE System SHALL track feedback metrics per user: average style match rating, acceptance rate (published vs rejected), and edit frequency
6. WHEN Voice_DNA is updated with new content, THE System SHALL re-generate embeddings and update Vector_Store within 5 minutes
7. THE System SHALL display Voice_DNA confidence score (0-100) based on amount of training data and feedback consistency

### Requirement 8: Image Analysis and Visual Content Suggestions

**User Story:** As a content creator, I want the system to analyze images and suggest relevant captions and content, so that my visual posts have compelling accompanying text.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE System SHALL accept formats: JPEG, PNG, WebP, maximum 10MB file size
2. THE System SHALL store images in Cloudflare R2 with unique identifiers and generate CDN URLs
3. THE Content_Generator SHALL use Google Vertex AI Vision model to analyze image content, detect objects, scenes, text, and mood
4. WHEN image analysis completes, THE System SHALL generate 3 caption variations matching user's Voice_DNA and incorporating visual elements
5. THE System SHALL suggest relevant hashtags based on image content and current trends
6. IF image contains text, THEN THE System SHALL extract and incorporate it into caption suggestions
7. IF image analysis fails, THEN THE System SHALL allow manual description input and generate captions based on user's description

### Requirement 9: Analytics and Performance Tracking

**User Story:** As a content creator, I want to track my content performance and understand what works best, so that I can refine my content strategy over time.

#### Acceptance Criteria

1. THE System SHALL display analytics dashboard showing: total posts published, average engagement rate per platform, top-performing content, and Voice_DNA confidence score
2. WHEN post performance data is available, THE System SHALL fetch metrics from platform APIs every 24 hours and store in Supabase
3. THE System SHALL calculate engagement rate as (likes + comments + shares) / impressions * 100 for each post
4. THE System SHALL identify top-performing content patterns: best posting times, most effective hashtags, optimal content length, and high-engagement topics
5. THE System SHALL display trend correlation: which trending topics led to highest engagement when incorporated
6. THE System SHALL provide weekly email reports (via Resend) summarizing performance metrics and actionable insights
7. THE System SHALL track AI generation metrics: average generation time, provider success rates, and user satisfaction scores

### Requirement 10: Team Collaboration and Multi-User Access

**User Story:** As a marketing manager, I want to invite team members with different permission levels, so that we can collaborate on content creation while maintaining control over publishing.

#### Acceptance Criteria

1. WHEN a user upgrades to Team plan, THE System SHALL enable team workspace creation with unique workspace identifier
2. THE System SHALL support role-based access control: Owner (full access), Editor (create and edit content), Viewer (read-only access)
3. WHEN an Owner invites a team member, THE System SHALL send email invitation (via Resend) with secure signup link valid for 7 days
4. THE System SHALL allow Editors to generate and schedule content but require Owner approval before publishing
5. THE System SHALL maintain audit log of all team actions: who created content, who edited, who published, with timestamps
6. THE System SHALL support workspace-level Voice_DNA that combines style patterns from multiple team members' approved content
7. WHEN team members collaborate, THE System SHALL prevent concurrent editing conflicts using optimistic locking with last-write-wins strategy

### Requirement 11: Subscription Management and Payment Processing

**User Story:** As a platform user, I want to subscribe to a paid plan that fits my needs, so that I can access advanced features and higher usage limits.

#### Acceptance Criteria

1. THE System SHALL offer three pricing tiers: Free (10 generations/month, 1 platform), Pro ($29/month, 100 generations/month, all platforms, analytics), Team ($99/month, unlimited generations, team features, priority support)
2. WHEN a user selects a paid plan, THE System SHALL redirect to Stripe Checkout with pre-filled user information
3. WHEN payment succeeds, THE System SHALL receive Stripe webhook, update user subscription status in Supabase, and grant access to tier features immediately
4. THE System SHALL enforce usage limits per tier using Redis counters that reset monthly
5. WHEN a user reaches 80% of their generation limit, THE System SHALL display warning notification and suggest upgrade
6. WHEN a user exceeds their limit, THE System SHALL block new generation requests and display upgrade prompt
7. THE System SHALL support subscription management: upgrade, downgrade, cancel, with prorated billing handled by Stripe
8. WHEN a subscription is cancelled, THE System SHALL maintain access until end of billing period, then downgrade to Free tier
9. THE System SHALL provide invoice history and downloadable receipts via Stripe Customer Portal

### Requirement 12: Rate Limiting and Cost Management

**User Story:** As a platform operator, I want to enforce rate limits and manage API costs, so that the system remains financially sustainable and prevents abuse.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce per-user limits: Free tier (10 requests/day), Pro tier (100 requests/day), Team tier (unlimited with 500 requests/hour throttle)
2. THE Rate_Limiter SHALL use Upstash Redis with sliding window algorithm to track request counts per user per time window
3. WHEN a user exceeds rate limit, THE System SHALL return HTTP 429 status with Retry-After header indicating reset time
4. THE System SHALL implement cost-aware AI provider selection: prefer Gemini Flash for simple requests, Gemini Pro for complex requests, Claude as fallback
5. THE System SHALL cache frequently requested data: trend lists (6 hours), Voice_DNA summaries (24 hours), platform guidelines (7 days)
6. THE Multi_Provider_Router SHALL track API costs per request and log to monitoring system for budget tracking
7. THE System SHALL implement circuit breaker pattern: if provider error rate exceeds 50% over 5 minutes, switch to fallback provider for 10 minutes

### Requirement 13: Security and Data Privacy

**User Story:** As a content creator, I want my data to be secure and private, so that my content and personal information are protected from unauthorized access.

#### Acceptance Criteria

1. THE Authentication_System SHALL enforce HTTPS for all connections with TLS 1.3 minimum
2. THE System SHALL implement Row Level Security (RLS) policies in Supabase ensuring users can only access their own data
3. THE System SHALL encrypt sensitive data at rest: API keys using AES-256, user tokens using bcrypt with salt rounds of 12
4. THE System SHALL validate all user inputs to prevent SQL injection, XSS, and command injection attacks
5. THE System SHALL implement CORS policies restricting API access to authorized frontend domains only
6. THE System SHALL never use user content for AI model training or share with third parties without explicit consent
7. WHEN a user deletes their account, THE System SHALL permanently delete all user data including posts, Voice_DNA, embeddings, and scheduled content within 30 days
8. THE System SHALL log all authentication events and suspicious activities for security monitoring
9. THE System SHALL implement Content Security Policy (CSP) headers to prevent XSS attacks
10. THE System SHALL conduct input sanitization on all user-generated content before storage and display

### Requirement 14: Error Handling and System Resilience

**User Story:** As a platform user, I want the system to handle errors gracefully and recover automatically, so that temporary failures don't disrupt my workflow.

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL return structured error responses with error code, user-friendly message, and optional retry guidance
2. THE Multi_Provider_Router SHALL implement exponential backoff retry logic: 1s, 2s, 4s delays for transient failures
3. WHEN external API (RapidAPI, Proxycurl) is unavailable, THE System SHALL display cached data with staleness indicator and retry in background
4. THE Background_Job_Processor SHALL implement dead letter queue for failed jobs after 3 retry attempts
5. WHEN database connection fails, THE System SHALL attempt reconnection with exponential backoff up to 30 seconds before failing request
6. THE System SHALL implement health check endpoints for all critical services: database, Redis, Pinecone, AI providers
7. WHEN system errors occur, THE System SHALL log detailed error context (stack trace, user ID, request ID) to monitoring system without exposing sensitive data to users
8. THE System SHALL display user-friendly error messages avoiding technical jargon: "We're having trouble connecting to Instagram. Please try again in a few minutes."

### Requirement 15: Performance and Scalability

**User Story:** As a platform operator, I want the system to handle growing user base efficiently, so that performance remains consistent as we scale to 10,000+ users.

#### Acceptance Criteria

1. THE System SHALL respond to content generation requests within 10 seconds for 95th percentile
2. THE System SHALL load dashboard and analytics pages within 2 seconds for 95th percentile
3. THE System SHALL handle 100 concurrent content generation requests without degradation
4. THE System SHALL implement database connection pooling with maximum 20 connections per serverless function
5. THE System SHALL use Vercel Edge Functions for static content delivery with global CDN caching
6. THE System SHALL implement lazy loading for analytics data: load summary first, detailed metrics on demand
7. THE System SHALL optimize database queries with appropriate indexes on frequently queried columns: user_id, created_at, platform, status
8. THE System SHALL implement pagination for list views: 20 items per page for content history, 50 items for analytics
9. THE System SHALL compress API responses using gzip for payloads larger than 1KB
10. THE System SHALL monitor and alert when response times exceed thresholds: p95 > 15s, p99 > 30s

## Success Metrics and KPIs

### User Acquisition and Retention
- Target 100 signups during hackathon demo period (48 hours)
- Target 60% onboarding completion rate (users who complete Voice_DNA setup)
- Target 40% weekly active user rate (users who generate content at least once per week)
- Target 25% free-to-paid conversion rate within 30 days

### Content Quality and Engagement
- Target average Voice_DNA match rating of 4.0/5.0 from user feedback
- Target 70% content acceptance rate (published without major edits)
- Target 30% improvement in engagement rates compared to user's historical baseline
- Target 85% user satisfaction score for generated content quality

### System Performance
- Target 95th percentile response time < 10 seconds for content generation
- Target 99.5% uptime for core services
- Target < 5% error rate for AI provider requests
- Target < $0.10 cost per content generation request

### Business Metrics
- Target $10,000 MRR (Monthly Recurring Revenue) within 3 months post-launch
- Target 30% month-over-month user growth
- Target < $5 customer acquisition cost (CAC) through organic and referral channels
- Target 6-month payback period for CAC

## Competitive Analysis

### vs Jasper AI
- **Advantage:** ContextFlow learns from user's actual posts (authentic voice), Jasper uses generic templates
- **Advantage:** Real-time trend integration, Jasper requires manual research
- **Disadvantage:** Jasper has more content types (blog posts, ads), ContextFlow focuses on social media
- **Differentiation:** Voice_DNA technology creates truly personalized content, not just template filling

### vs Copy.ai
- **Advantage:** Multi-platform optimization in single workflow, Copy.ai requires separate generation per platform
- **Advantage:** Engagement prediction based on user's historical data, Copy.ai lacks personalization
- **Disadvantage:** Copy.ai has larger template library and more use cases
- **Differentiation:** Trend intelligence engine provides timely content ideas, Copy.ai is reactive

### vs ChatGPT
- **Advantage:** No prompt engineering required, ContextFlow automates style matching
- **Advantage:** Platform-specific optimization and scheduling, ChatGPT only generates text
- **Advantage:** Integrated analytics and performance tracking
- **Differentiation:** Purpose-built for content creators with end-to-end workflow, ChatGPT is general-purpose

### vs Buffer/Hootsuite
- **Advantage:** AI-powered content generation, Buffer/Hootsuite only schedule existing content
- **Advantage:** Voice learning and style consistency, scheduling tools don't create content
- **Disadvantage:** Buffer/Hootsuite have more mature scheduling features and platform integrations
- **Differentiation:** ContextFlow combines creation + optimization + scheduling, Buffer is scheduling-only

## Risk Assessment and Mitigation

### Technical Risks

**Risk 1: AI Provider Outages**
- **Impact:** High - Core functionality unavailable
- **Probability:** Medium - Cloud services have occasional outages
- **Mitigation:** Multi-provider architecture with automatic fallback (Vertex AI → Claude), cache recent generations for offline access

**Risk 2: Rate Limiting from Social Media APIs**
- **Impact:** High - Cannot ingest content or post
- **Probability:** High - RapidAPI scrapers may hit limits
- **Mitigation:** Implement request queuing, use multiple API keys rotation, provide manual upload fallback

**Risk 3: Vector Database Performance Degradation**
- **Impact:** Medium - Slow content generation
- **Probability:** Low - Pinecone is designed for scale
- **Mitigation:** Implement query result caching, optimize metadata filters, use Pinecone's performance tier

**Risk 4: Serverless Cold Starts**
- **Impact:** Medium - Slow initial response times
- **Probability:** High - Vercel functions have cold start latency
- **Mitigation:** Use Edge Functions for critical paths, implement warming strategy, set appropriate timeout limits

### Business Risks

**Risk 5: Low User Adoption**
- **Impact:** High - Product-market fit failure
- **Probability:** Medium - Competitive market
- **Mitigation:** Focus on hackathon demo quality, gather early user feedback, iterate quickly on pain points

**Risk 6: High AI API Costs**
- **Impact:** High - Unsustainable unit economics
- **Probability:** Medium - AI costs can escalate with usage
- **Mitigation:** Implement aggressive caching, use cost-effective models (Gemini Flash), enforce strict rate limits

**Risk 7: Legal Issues with Content Scraping**
- **Impact:** High - Platform bans or legal action
- **Probability:** Medium - Terms of Service violations
- **Mitigation:** Use only authorized APIs and scrapers, require explicit user consent, provide manual upload alternative

### Security Risks

**Risk 8: Data Breach or Unauthorized Access**
- **Impact:** Critical - User trust loss, legal liability
- **Probability:** Low - With proper security measures
- **Mitigation:** Implement RLS policies, encrypt sensitive data, conduct security audits, use Supabase's built-in security features

**Risk 9: Prompt Injection Attacks**
- **Impact:** Medium - Generated content manipulation
- **Probability:** Medium - AI systems vulnerable to adversarial inputs
- **Mitigation:** Sanitize all user inputs, implement content filtering, use structured prompts with clear boundaries

## Platform-Specific Requirements

### Instagram Requirements
- Content length: Maximum 2,200 characters for captions
- Hashtag strategy: 3-5 relevant hashtags (avoid spam appearance)
- Image requirements: Minimum 1080x1080px, aspect ratios 1:1, 4:5, 9:16
- Tone: Casual, visual-focused, emoji-friendly
- Optimal posting times: Weekdays 11am-1pm, Wednesdays and Fridays highest engagement

### LinkedIn Requirements
- Content length: Maximum 3,000 characters, optimal 150-300 for high engagement
- Hashtag strategy: 1-2 professional hashtags maximum
- Tone: Professional, thought-leadership, data-driven
- Content types: Industry insights, career advice, company updates, professional achievements
- Optimal posting times: Tuesday-Thursday 8am-10am, business hours

### Twitter/X Requirements
- Content length: 280 characters maximum per tweet
- Thread support: Multi-tweet threads for longer content (number each tweet)
- Hashtag strategy: 1-2 hashtags maximum, avoid hashtag stuffing
- Tone: Concise, conversational, timely
- Optimal posting times: Weekdays 9am-3pm, highest engagement during lunch hours

### Threads Requirements
- Content length: 500 characters maximum
- Tone: Casual, conversational, authentic (similar to Instagram but text-focused)
- Content style: Personal stories, quick thoughts, community engagement
- Hashtag strategy: Minimal, focus on natural conversation
- Optimal posting times: Similar to Instagram, evenings and weekends perform well
