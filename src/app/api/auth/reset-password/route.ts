import { getAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password, uid } = await request.json();

    if (!password || !uid) {
      return NextResponse.json(
        { error: 'Password and user ID are required' },
        { status: 400 }
      );
    }

    const auth = getAuth();
    
    // Update password
    await auth.updateUser(uid, {
      password,
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
