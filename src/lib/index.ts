/**
 * Library exports
 */

export { config } from "./config";
export { auth as firebaseAuth, app as firebaseApp } from "./firebase";
export { getAuth as getFirebaseAdminAuth, getFirestore as getFirebaseFirestore, initializeFirebaseAdmin } from "./firebase-admin";
export type { 
  Profile, 
  ConnectedAccount, 
  GeneratedContent, 
  ScheduledPost, 
  VoiceDNAMetadata, 
  Trend 
} from "./supabase";
export { uploadFileToS3, getUploadSignedUrl, getDownloadSignedUrl, deleteFileFromS3, listFiles } from "./aws";
export { cn, formatRelativeTime, formatNumber, generateId, debounce, truncate, platformColors, platformNames } from "./utils";
export { 
  scrapeInstagram, 
  scrapeLinkedIn, 
  scrapeTwitter, 
  scrapeMultiplePlatforms 
} from "./social-scrapers";
export type { ScrapedPost, ScraperResult } from "./social-scrapers";
