import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleIdToken } from '@/lib/googleAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'Missing Google credential' },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleIdToken(credential);
    const now = new Date().toISOString();

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', googleUser.email)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    let user = existingUser;

    if (!user) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: randomUUID(),
          email: googleUser.email,
          name: googleUser.name,
          created_at: now,
          updated_at: now,
        })
        .select('id, email, name')
        .single();

      if (insertError) {
        throw insertError;
      }

      user = newUser;
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Google sign-in failed:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
