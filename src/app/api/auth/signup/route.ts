/**
 * POST /api/auth/signup
 * Create a new user account
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuth, getFirestore } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name" },
        { status: 400 }
      );
    }

    const auth = getAuth();
    
    // Create user with Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create user profile in Firestore
    if (userRecord) {
      const firestore = getFirestore();
      try {
        await firestore.collection("profiles").doc(userRecord.uid).set({
          id: userRecord.uid,
          email,
          name,
          subscription_tier: "free",
          subscription_status: "active",
          onboarding_completed: false,
          voice_dna_status: "pending",
          voice_dna_confidence: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the request, user was created
      }
    }

    return NextResponse.json({
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
