/**
 * GET /api/calendar/events - Fetch calendar events
 * POST /api/calendar/events - Create calendar event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

async function getUserAccessToken(userId: string): Promise<string | null> {
  const firestore = getFirestore();
  const tokenDoc = await firestore
    .collection('calendar_tokens')
    .doc(userId)
    .get();

  if (!tokenDoc.exists) {
    return null;
  }

  return tokenDoc.data()?.access_token || null;
}

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
    const accessToken = await getUserAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax');

    // Build Google Calendar API URL
    const params = new URLSearchParams({
      timeMin,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    if (timeMax) {
      params.append('timeMax', timeMax);
    }

    // Fetch events from Google Calendar
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch calendar events');
    }

    const data = await response.json();

    return NextResponse.json({
      events: data.items || [],
      nextPageToken: data.nextPageToken,
    });
  } catch (error: any) {
    console.error('Fetch calendar events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const accessToken = await getUserAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { summary, description, start, end, timeZone = 'UTC' } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, start, end' },
        { status: 400 }
      );
    }

    // Create event in Google Calendar
    const eventData = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone,
      },
      end: {
        dateTime: end,
        timeZone,
      },
    };

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create calendar event');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    });
  } catch (error: any) {
    console.error('Create calendar event error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
