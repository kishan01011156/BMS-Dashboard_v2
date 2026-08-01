import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the battery record
    const { data: battery } = await supabaseAdmin
      .from('batteries')
      .select('*')
      .eq('user_id', session.userId)
      .maybeSingle();

    if (!battery) {
      return NextResponse.json({ error: 'No battery found' }, { status: 404 });
    }

    // Fetch all causes records (diagnostics history)
    const { data: causes } = await supabaseAdmin
      .from('causes')
      .select('*')
      .eq('battery_id', battery.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      battery,
      causes: causes || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
