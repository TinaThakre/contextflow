/**
 * GET /api/voice-dna/profile?platform=instagram
 *
 * Returns the most-recent Voice DNA for the authenticated user
 * on the requested platform.
 *
 * Security: user_id is always derived from the verified Firebase token —
 * the caller cannot supply an arbitrary user ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getVoiceDNA } from '@/lib/database';

const ALLOWED_PLATFORMS = ['instagram', 'twitter', 'linkedin'] as const;
type AllowedPlatform = (typeof ALLOWED_PLATFORMS)[number];

function isAllowedPlatform(v: string): v is AllowedPlatform {
  return (ALLOWED_PLATFORMS as readonly string[]).includes(v);
}

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized', error: 'Missing authorization header' },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);
  const auth = getAuth();

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid token', error: 'Token verification failed' },
      { status: 401 },
    );
  }

  // ── Platform param ──────────────────────────────────────────────
  const platform = request.nextUrl.searchParams.get('platform') ?? '';

  if (!platform) {
    return NextResponse.json(
      { success: false, message: 'Missing platform query parameter' },
      { status: 400 },
    );
  }

  if (!isAllowedPlatform(platform)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid platform. Must be one of: ${ALLOWED_PLATFORMS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // ── Fetch from DB ───────────────────────────────────────────────
  let voiceDNA;
  try {
    voiceDNA = await getVoiceDNA(userId, platform);
  } catch (err: any) {
    console.error('[profile] DB error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Voice DNA', error: err.message },
      { status: 500 },
    );
  }

  if (!voiceDNA) {
    return NextResponse.json(
      {
        success: false,
        message: `No Voice DNA found for platform: ${platform}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: voiceDNA.id,
      platform: voiceDNA.platform,
      version: voiceDNA.version,
      createdAt: voiceDNA.createdAt,
      lastUpdated: voiceDNA.lastUpdated,
      confidence: voiceDNA.confidence,
      coreIdentity: voiceDNA.coreIdentity,
      writingDNA: voiceDNA.writingDNA,
      visualDNA: voiceDNA.visualDNA,
      strategyDNA: voiceDNA.strategyDNA,
      behavioralDNA: voiceDNA.behavioralDNA,
      generationTemplates: voiceDNA.generationTemplates,
    },
  });
}
