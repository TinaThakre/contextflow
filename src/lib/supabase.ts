/**
 * Legacy Supabase types - kept for backward compatibility
 * Data is now stored in Firebase Firestore
 */

export type Profile = {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  subscription_status: string;
  onboarding_completed: boolean;
  voice_dna_status: string;
  voice_dna_confidence: number;
  created_at?: string;
  updated_at?: string;
};

export type ConnectedAccount = any;
export type GeneratedContent = any;
export type ScheduledPost = any;
export type VoiceDNAMetadata = any;
export type Trend = any;
