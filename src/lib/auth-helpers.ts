// Authentication Helpers for API Routes
// Uses Firebase Admin SDK to verify tokens

import { getAuth } from './firebase-admin';

export interface AuthenticatedRequest {
  userId: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Verify Firebase ID token from request headers
 * @param request - Next.js Request object
 * @returns Decoded token with user info
 * @throws Error if token is invalid or missing
 */
export async function verifyAuth(request: Request): Promise<AuthenticatedRequest> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(token);

    return {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Middleware wrapper for authenticated API routes
 * @param handler - API route handler function
 * @returns Wrapped handler with authentication
 */
export function withAuth(
  handler: (request: Request, auth: AuthenticatedRequest) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const authData = await verifyAuth(request);
      return await handler(request, authData);
    } catch (error) {
      return Response.json(
        { error: 'Unauthorized', message: (error as Error).message },
        { status: 401 }
      );
    }
  };
}

/**
 * Get user ID from request (throws if not authenticated)
 * @param request - Next.js Request object
 * @returns Firebase user ID
 */
export async function getUserId(request: Request): Promise<string> {
  const auth = await verifyAuth(request);
  return auth.userId;
}

/**
 * Check if user owns a resource
 * @param request - Next.js Request object
 * @param resourceUserId - User ID of the resource owner
 * @returns True if user owns the resource
 */
export async function checkOwnership(
  request: Request,
  resourceUserId: string
): Promise<boolean> {
  try {
    const auth = await verifyAuth(request);
    return auth.userId === resourceUserId;
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
}

/**
 * Verify auth and check ownership in one call
 * @param request - Next.js Request object
 * @param resourceUserId - User ID of the resource owner
 * @throws Error if not authenticated or not owner
 */
export async function verifyOwnership(
  request: Request,
  resourceUserId: string
): Promise<void> {
  const auth = await verifyAuth(request);
  
  if (auth.userId !== resourceUserId) {
    throw new Error('Forbidden: You do not own this resource');
  }
}
