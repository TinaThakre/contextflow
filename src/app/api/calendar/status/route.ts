/**
 * GET /api/calendar/status
 * Check if user has connected Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const firestore = getFirestore();

    // Check if user has calendar token
    const tokenDoc = await firestore
      .collection('calendar_tokens')
      .doc(userId)
      .get();

    const connected = tokenDoc.exists && !!tokenDoc.data()?.access_token;

    return NextResponse.json({
      connected,
      connectedAt: tokenDoc.data()?.connected_at || null,
    });
  } catch (error: any) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
