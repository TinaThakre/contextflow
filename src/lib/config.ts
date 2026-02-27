/**
 * Environment Configuration
 * All configuration values are read from environment variables
 */

export const config = {
  // App
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    env: process.env.NODE_ENV || "development",
  },

  // Supabase (deprecated - migrated to Firebase)
  // supabase: {
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  //   anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  //   serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  // },

  // Firebase
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  },

  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "us-east-1",
    s3Bucket: process.env.AWS_S3_BUCKET_NAME || "",
  },

  // Google Cloud (Vertex AI)
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  },

  // Anthropic (Claude)
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  // Pinecone
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || "",
    environment: process.env.PINECONE_ENVIRONMENT || "",
    indexName: process.env.PINECONE_INDEX_NAME || "contextflow-content",
  },

  // Upstash Redis
  redis: {
    restUrl: process.env.UPSTASH_REDIS_REST_URL || "",
    restToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  },

  // QStash
  qstash: {
    url: process.env.QSTASH_URL || "",
    token: process.env.QSTASH_TOKEN || "",
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
  },

  // Cloudflare R2
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "",
    publicUrl: process.env.R2_PUBLIC_URL || "",
  },

  // External APIs
  external: {
    rapidApiKey: process.env.RAPIDAPI_KEY || "",
    rapidApiHostInstagram: process.env.RAPIDAPI_HOST_INSTAGRAM || "instagram-scraper-api2.p.rapidapi.com",
    rapidApiHostLinkedIn: process.env.RAPIDAPI_HOST_LINKEDIN || "linkedin-data-api.p.rapidapi.com",
    rapidApiHostTwitter: process.env.RAPIDAPI_HOST_TWITTER || "twitter-api45.p.rapidapi.com",
    proxycurlApiKey: process.env.PROXYCURL_API_KEY || "",
    newsApiKey: process.env.NEWS_API_KEY || "",
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    proAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
    teamMonthlyPriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "",
    teamAnnualPriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || "",
  },

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "noreply@contextflow.ai",
  },

  // Rate Limits
  rateLimits: {
    free: {
      generations: parseInt(process.env.RATE_LIMIT_FREE_GENERATIONS || "10"),
      window: parseInt(process.env.RATE_LIMIT_FREE_WINDOW || "86400"),
      apiCalls: parseInt(process.env.RATE_LIMIT_FREE_API_CALLS || "100"),
      apiWindow: parseInt(process.env.RATE_LIMIT_FREE_API_WINDOW || "3600"),
    },
    pro: {
      generations: parseInt(process.env.RATE_LIMIT_PRO_GENERATIONS || "100"),
      window: parseInt(process.env.RATE_LIMIT_PRO_WINDOW || "86400"),
      apiCalls: parseInt(process.env.RATE_LIMIT_PRO_API_CALLS || "1000"),
      apiWindow: parseInt(process.env.RATE_LIMIT_PRO_API_WINDOW || "3600"),
    },
    team: {
      generations: parseInt(process.env.RATE_LIMIT_TEAM_GENERATIONS || "500"),
      window: parseInt(process.env.RATE_LIMIT_TEAM_WINDOW || "86400"),
      apiCalls: parseInt(process.env.RATE_LIMIT_TEAM_API_CALLS || "5000"),
      apiWindow: parseInt(process.env.RATE_LIMIT_TEAM_API_WINDOW || "3600"),
    },
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || "",
  },
};

// Helper to check if running on server
export const isServer = typeof window === "undefined";

// Helper to check if running in production
export const isProduction = config.app.env === "production";
