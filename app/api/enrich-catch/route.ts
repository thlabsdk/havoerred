import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enrichCatch } from '@/lib/enrichment';

const bodySchema = z.object({
  catchId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  let catchId: number | undefined;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    catchId = parsed.data.catchId;
    const result = await enrichCatch(catchId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const prefix = catchId !== undefined ? `[enrich-catch id=${catchId}]` : '[enrich-catch]';
    console.error(`${prefix} route failed:`, message);
    return NextResponse.json(
      { error: 'Enrichment failed', details: message },
      { status: 500 }
    );
  }
}
