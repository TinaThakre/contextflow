/**
 * Google Calendar API Integration
 * Handles OAuth flow and calendar operations
 */

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  status?: string;
  htmlLink?: string;
}

/**
 * Initiate Google Calendar OAuth flow
 */
export async function connectGoogleCalendar(): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    const provider = new GoogleAuthProvider();
    
    // Add Calendar API scopes
    CALENDAR_SCOPES.forEach(scope => {
      provider.addScope(scope);
    });

    // Force account selection
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider);
    
    // Get the OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Store the access token in Firestore for the user
    await storeCalendarToken(result.user.uid, accessToken);

    return {
      success: true,
      accessToken,
    };
  } catch (error: any) {
    console.error('Google Calendar connection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Google Calendar',
    };
  }
}

/**
 * Store calendar access token in Firestore
 */
async function storeCalendarToken(userId: string, accessToken: string): Promise<void> {
  try {
    const response = await fetch('/api/calendar/store-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store calendar token');
    }
  } catch (error) {
    console.error('Error storing calendar token:', error);
    throw error;
  }
}

/**
 * Fetch calendar events from Google Calendar
 */
export async function fetchCalendarEvents(
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  try {
    if (!auth?.currentUser) {
      throw new Error('User not authenticated');
    }

    const idToken = await auth.currentUser.getIdToken();
    
    const params = new URLSearchParams();
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(`/api/calendar/events?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    if (!auth?.currentUser) {
      throw new Error('User not authenticated');
    }

    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create calendar event');
    }

    const data = await response.json();
    return {
      success: true,
      eventId: data.eventId,
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

/**
 * Check if user has connected Google Calendar
 */
export async function checkCalendarConnection(): Promise<boolean> {
  try {
    if (!auth?.currentUser) {
      return false;
    }

    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch('/api/calendar/status', {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.connected || false;
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    return false;
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!auth?.currentUser) {
      throw new Error('User not authenticated');
    }

    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch('/api/calendar/disconnect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Google Calendar');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return {
      success: false,
      error: error.message || 'Failed to disconnect Google Calendar',
    };
  }
}
