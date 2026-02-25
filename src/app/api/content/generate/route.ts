/**
 * POST /api/content/generate
 * Generate AI content using Voice DNA
 */

import { NextRequest, NextResponse } from "next/server";
import { GeneratedContent } from "@/lib/supabase";
import { getAuth, getFirestore } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platforms,
      prompt,
      trendId,
      imageUrl,
      toneAdjustment,
      variationCount = 3,
    } = body;

    // Validate input
    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required" },
        { status: 400 }
      );
    }

    // Get user from auth header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token with Firebase Admin
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      console.error("Firebase auth error:", authError);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get Firestore client for database operations
    const firestore = getFirestore();

    // Check rate limits based on subscription tier
    // TODO: Implement rate limiting

    // Get user's Voice DNA
    const voiceDNADoc = await firestore
      .collection("voice_dna_metadata")
      .where("user_id", "==", userId)
      .limit(1)
      .get();

    // If no Voice DNA, use default settings
    const userVoiceDNA = voiceDNADoc.empty ? {
      tone_formal: 25,
      tone_casual: 25,
      tone_humorous: 25,
      tone_professional: 25,
    } : voiceDNADoc.docs[0].data();

    // Get trend context if provided
    let trendContext = "";
    if (trendId) {
      const trendDoc = await firestore
        .collection("trends")
        .doc(trendId)
        .get();

      if (trendDoc.exists) {
        const trend = trendDoc.data();
        trendContext = `
          Trending Topic: ${trend?.title}
          Context: ${trend?.context}
          Key Points: ${trend?.key_points?.join(", ") || ""}
          Hashtags: ${trend?.hashtags?.join(", ") || ""}
        `;
      }
    }

    // Build generation prompt (simplified)
    const generationPrompt = buildGenerationPrompt({
      platforms,
      prompt,
      trendContext,
      userVoiceDNA,
      toneAdjustment,
    });

    // TODO: Call Vertex AI or Claude for actual generation
    // For now, return mock data
    const variations: Partial<GeneratedContent>[] = platforms.flatMap((platform: string) =>
      Array.from({ length: variationCount }, (_, i) => ({
        id: `generated-${Date.now()}-${i}`,
        user_id: userId,
        platform,
        prompt,
        generated_text: generateMockContent(platform, prompt),
        engagement_score: Math.floor(Math.random() * 40) + 60,
        hashtags: ["#content", "#ai", "#growth"],
        suggested_post_time: new Date(Date.now() + 86400000).toISOString(),
        character_count: 200 + Math.floor(Math.random() * 100),
        created_at: new Date().toISOString(),
        ai_provider: Math.random() > 0.2 ? "vertex" : "claude",
      }))
    );

    // Store generated content in Firestore
    const storedContent = [];
    try {
      const batch = firestore.batch();
      
      for (const variation of variations) {
        const docRef = firestore.collection("generated_content").doc();
        batch.set(docRef, {
          user_id: userId,
          platform: variation.platform,
          prompt: variation.prompt,
          generated_text: variation.generated_text,
          engagement_score: variation.engagement_score,
          hashtags: variation.hashtags,
          suggested_post_time: variation.suggested_post_time,
          ai_provider: variation.ai_provider,
          published: false,
          created_at: new Date().toISOString(),
        });
        storedContent.push({ id: docRef.id, ...variation });
      }
      
      await batch.commit();
    } catch (storeError) {
      console.error("Error storing content:", storeError);
    }

    return NextResponse.json({
      variations: storedContent.length > 0 ? storedContent : variations,
      metadata: {
        generationTime: Date.now(),
        provider: "vertex",
        tokensUsed: generationPrompt.length / 4,
      },
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildGenerationPrompt({
  platforms,
  prompt,
  trendContext,
  userVoiceDNA,
  toneAdjustment,
}: {
  platforms: string[];
  prompt?: string;
  trendContext: string;
  userVoiceDNA: Record<string, number>;
  toneAdjustment?: string;
}) {
  const platformList = platforms.join(", ");
  const toneProfile = `Formal: ${userVoiceDNA.tone_formal}%, Casual: ${userVoiceDNA.tone_casual}%, Humorous: ${userVoiceDNA.tone_humorous}%, Professional: ${userVoiceDNA.tone_professional}%`;

  let promptText = `Generate ${platformList} content`;
  if (prompt) promptText += ` about: ${prompt}`;
  if (trendContext) promptText += `\n\nTrend Context: ${trendContext}`;
  promptText += `\n\nUser Voice Profile: ${toneProfile}`;
  if (toneAdjustment) promptText += `\n\nTone Adjustment: ${toneAdjustment}`;

  return promptText;
}

function generateMockContent(platform: string, prompt?: string): string {
  const templates: Record<string, string[]> = {
    instagram: [
      "✨ {topic} is changing the game! Here's what you need to know 👇",
      "Ever wondered about {topic}? Here's your complete guide 📚",
      "5 insights about {topic} that will transform your perspective 🔥",
    ],
    linkedin: [
      "I'd like to share some thoughts on {topic} and its impact on our industry.",
      "After years of experience, here's what I've learned about {topic}.",
      "The future of {topic}: 3 key trends to watch in 2024.",
    ],
    twitter: [
      "Hot take: {topic} is underrated 🧵",
      "Let's talk about {topic} (1/3)",
      "{topic} is the future and here's why 👇",
    ],
    threads: [
      "So about {topic}... 🧵",
      "Unpopular opinion: {topic} gets too much hype",
      "Everything you need to know about {topic} 👇",
    ],
  };

  const platformTemplates = templates[platform] || templates.instagram;
  const template = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
  
  return template.replace("{topic}", prompt || "this topic");
}
