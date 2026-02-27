// Voice DNA Type Definitions

export interface StoredPost {
  id: string;
  userId: string;
  platform: 'instagram' | 'twitter' | 'linkedin';
  postId: string;
  postUrl: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel';
  caption: string;
  hashtags: string[];
  visualAnalysis?: VisualAnalysis;
  engagement: EngagementMetrics;
  createdAt: number;
  lastAnalyzed?: number;
}

export interface VisualAnalysis {
  dominantColors: string[];
  detectedObjects: string[];
  sceneType: string;
  mood: string;
  composition: string;
  visualThemes: string[];
  textInImage?: string[];
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  viewCount?: number;
  shares?: number;
}

export interface VoiceDNA {
  id: string;
  userId: string;
  platform: string;
  version: string;
  createdAt: number;
  lastUpdated: number;
  
  coreIdentity: CoreIdentity;
  writingDNA: WritingDNA;
  visualDNA: VisualDNA;
  strategyDNA: StrategyDNA;
  behavioralDNA: BehavioralDNA;
  generationTemplates: GenerationTemplates;
  confidence: ConfidenceScores;
}

export interface CoreIdentity {
  primaryVoice: {
    tone: string;
    personality: string[];
    communicationStyle: string;
  };
  contentPillars: Array<{
    pillar: string;
    weight: number;
    keywords: string[];
  }>;
  uniqueSignature: {
    catchphrases: string[];
    writingQuirks: string[];
    visualSignature: string;
  };
}

export interface WritingDNA {
  styleProfile: {
    sentenceRhythm: string;
    vocabularyLevel: string;
    emotionalRange: string[];
    punctuationPersonality: string;
  };
  contentStructure: {
    openingStyle: string;
    bodyStructure: string;
    closingStyle: string;
    ctaPattern: string;
  };
  linguisticPatterns: {
    favoriteWords: string[];
    phraseTemplates: string[];
    metaphorStyle: string;
    storytellingApproach: string;
  };
}

export interface VisualDNA {
  aestheticProfile: {
    colorIdentity: {
      palette: string[];
      mood: string;
      consistency: number;
    };
    compositionStyle: {
      framing: string;
      perspective: string;
      lighting: string;
    };
    contentMix: {
      primaryType: string;
      secondaryTypes: string[];
      variety: number;
    };
  };
  visualNarrative: {
    storyTelling: string;
    emotionalImpact: string;
    brandingElements: string[];
  };
}

export interface StrategyDNA {
  hashtagFormula: {
    optimalCount: number;
    categoryMix: string[];
    effectivePatterns: Array<{
      context: string;
      hashtags: string[];
      expectedEngagement: number;
    }>;
  };
  contentFormula: {
    winningCombinations: Array<{
      visualStyle: string;
      captionApproach: string;
      hashtags: string[];
      timing: string;
      expectedPerformance: number;
    }>;
  };
  engagementDrivers: {
    topTriggers: string[];
    audiencePreferences: string[];
    contentGaps: string[];
  };
}

export interface BehavioralDNA {
  postingBehavior: {
    frequency: string;
    consistency: number;
    optimalTiming: string[];
  };
  evolutionPattern: {
    contentEvolution: string;
    styleShifts: Array<{
      period: string;
      change: string;
    }>;
  };
}

export interface GenerationTemplates {
  captionTemplates: Array<{
    template: string;
    context: string;
    variables: string[];
    exampleOutput: string;
  }>;
  hashtagSets: Array<{
    name: string;
    tags: string[];
    useCase: string;
  }>;
  visualGuidelines: {
    colorSchemes: string[][];
    compositionRules: string[];
    contentTypes: string[];
  };
}

export interface ConfidenceScores {
  overallConfidence: number;
  dataQuality: {
    sampleSize: number;
    dateRange: number;
    completeness: number;
  };
  analysisDepth: {
    textualAnalysis: number;
    visualAnalysis: number;
    correlationAnalysis: number;
  };
}

// Feedback Types
export interface GeneratedContentFeedback {
  id: string;
  userId: string;
  platform: string;
  generatedContentId: string;
  content: {
    caption: string;
    hashtags: string[];
    visualGuidelines?: object;
  };
  feedback: {
    rating: 'thumbs_up' | 'thumbs_down';
    timestamp: number;
    specificIssues?: string[];
    editedVersion?: string;
    usedInPost?: boolean;
  };
  generationContext: {
    voiceDNAVersion: string;
    prompt: string;
    visualContext?: string;
    confidenceScore: number;
  };
  learningData: {
    processed: boolean;
    appliedToVoiceDNA: boolean;
    impactScore: number;
  };
}

export interface LearningMetrics {
  userId: string;
  platform: string;
  feedbackStats: {
    totalGenerated: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
    weeklyTrend: Array<{
      week: string;
      satisfactionRate: number;
    }>;
  };
  improvement: {
    initialSatisfactionRate: number;
    currentSatisfactionRate: number;
    improvementPercentage: number;
    improvedAspects: Array<{
      aspect: string;
      beforeScore: number;
      afterScore: number;
    }>;
  };
  usagePatterns: {
    generationsPerWeek: number;
    mostGeneratedContentType: string;
    peakUsageTimes: string[];
    actualPostUsageRate: number;
  };
}

export interface GeneratedContent {
  id: string;
  caption: string;
  hashtags: string[];
  visualGuidelines?: {
    colorSchemes: string[][];
    compositionRules: string[];
    contentTypes: string[];
  };
  metadata: {
    voiceDNAVersion: string;
    confidenceScore: number;
    generatedAt: number;
  };
}
