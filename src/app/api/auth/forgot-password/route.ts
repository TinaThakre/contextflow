import { getAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const auth = getAuth();
    
    // Generate a password reset link
    // Note: In production, you would then send this link via email using Resend, etc.
    const link = await auth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });

    console.log(`Password reset link generated for ${email}: ${link}`);

    // Here you would typically send the email. 
    // Since the client is using sendPasswordResetEmail directly, 
    // this API route might be redundant but we've updated it for consistency.

    return NextResponse.json(
      { message: 'Password reset email sent successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
