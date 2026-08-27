import { NextRequest, NextResponse } from 'next/server';
import { getAllPatterns, savePattern } from '@/lib/db';
import { Pattern } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const patterns = await getAllPatterns(query);
    return NextResponse.json({ patterns });
  } catch (error: any) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Pattern;
    if (!body.id || !body.title || !body.kinar_grid) {
      return NextResponse.json(
        { error: 'Missing required pattern fields (id, title, kinar_grid)' },
        { status: 400 }
      );
    }

    await savePattern(body);
    return NextResponse.json({ success: true, pattern: body });
  } catch (error: any) {
    console.error('Error saving pattern:', error);
    return NextResponse.json(
      { error: 'Failed to save pattern', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
