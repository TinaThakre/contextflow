/**
 * POST /api/calendar/store-token
 * Store Google Calendar access token for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken } = body;

    console.log('Store token request:', { userId: userId ? 'present' : 'missing', accessToken: accessToken ? 'present' : 'missing' });

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing userId or accessToken' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    
    // Store the token in Firestore
    try {
      await firestore.collection('calendar_tokens').doc(userId).set({
        access_token: accessToken,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { merge: true });

      console.log('Token stored successfully for user:', userId);
    } catch (firestoreError: any) {
      console.error('Firestore write error:', firestoreError);
      throw new Error(`Failed to write to Firestore: ${firestoreError.message}. Make sure Firestore is enabled in your Firebase project.`);
    }

    // Update user profile to mark calendar as connected (use set with merge to create if not exists)
    try {
      await firestore.collection('profiles').doc(userId).set({
        calendar_connected: true,
        calendar_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { merge: true });

      console.log('Profile updated successfully for user:', userId);
    } catch (profileError: any) {
      // Log but don't fail if profile update fails
      console.warn('Profile update failed (non-critical):', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar token stored successfully',
    });
  } catch (error: any) {
    console.error('Store token error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
