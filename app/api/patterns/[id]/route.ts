import { NextRequest, NextResponse } from 'next/server';
import { getPatternById, savePattern, deletePattern } from '@/lib/db';
import { Pattern } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pattern = await getPatternById(params.id);
    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }
    return NextResponse.json({ pattern });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch pattern', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as Pattern;
    body.id = params.id;
    await savePattern(body);
    return NextResponse.json({ success: true, pattern: body });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update pattern', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePattern(params.id);
    return NextResponse.json({ success: true, message: 'Pattern deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete pattern', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
