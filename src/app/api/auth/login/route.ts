/**
 * POST /api/auth/login
 * Authenticate user and return session token
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    // Validate input
    if (!idToken) {
      return NextResponse.json(
        { error: "Missing required field: idToken" },
        { status: 400 }
      );
    }

    const auth = getAuth();
    
    // Verify the Firebase ID token
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get user record
      const userRecord = await auth.getUser(uid);

      return NextResponse.json({
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
        },
        message: "Login successful",
      });
    } catch (authError: any) {
      return NextResponse.json(
        { error: "Invalid token or authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
