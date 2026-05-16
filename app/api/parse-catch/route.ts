import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { catchSchema } from '@/lib/catch-schema';
import { fetchSpots } from '@/lib/spots_repo';
import type { Spot } from '@/types/spot';

const debugEnabled = () => {
  const v = process.env.DEBUG_AI_PARSE;
  return v === '1' || v === 'true';
};

const debugLog = (...args: unknown[]) => {
  if (debugEnabled()) {
    console.log(...args);
  }
};

const formatSpotsForPrompt = (spots: Spot[]): string => {
  if (spots.length === 0) return 'NONE';
  return JSON.stringify(
    spots.map((s) => ({
      id: s.id,
      name: s.name,
      aliases: s.aliases,
      bodyOfWater: s.bodyOfWater || undefined,
    }))
  );
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          details: 'Set OPENAI_API_KEY in the environment before calling this endpoint.',
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_PARSE_MODEL ?? 'gpt-4o-mini';

    const requestBody = await request.json();
    debugLog('Incoming parse-catch request body:', requestBody);

    const { description } = requestBody;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        {
          error: 'Description is required',
          details: 'The request body must include a non-empty description string.',
        },
        { status: 400 }
      );
    }

    let spots: Spot[] = [];
    try {
      spots = await fetchSpots();
    } catch (spotsError) {
      console.error('Failed to fetch spots for AI prompt; proceeding without spot context:', spotsError);
    }
    const validSpotIds = new Set(spots.map((s) => s.id));

    const systemPrompt = `You are a Danish fishing log assistant. Parse the user's natural language description of a sea trout catch and extract the information.

Return ONE JSON object with EXACTLY these fields. Use the empty string "" for unknown text fields. NEVER use null for text fields.

- date: string in dd/mm/yyyy format, or "" if not given.
- timeOfDay: string in 24h HH:mm format (e.g. "06:30", "18:45"), or "" if not given. Normalize Danish phrasing ("kl 6 om morgenen" -> "06:00", "halv ni" -> "08:30", "ved middagstid" -> "12:00", "om aftenen kl. 7" -> "19:00").
- location: string, the fishing spot. REQUIRED. If the description does not name a spot, use "Ukendt".
- fjord: string, the fjord/body of water, or "" if not mentioned.
- bait: string, the bait used. REQUIRED. If not given, use "Ukendt".
- lengthCm: integer length in cm, or null if not given. Strip any unit text.
- undersized: boolean. Will be re-derived from length on the server — set to false if you are unsure.
- notes: string, any extra detail worth keeping. "" if nothing notable.
- spotId: number or null. The id of the matching known spot if the description clearly references one of the user's spots below; otherwise null.

KNOWN SPOTS (canonical name + aliases). If the description names one of these spots (by canonical name, alias, or close variant), set spotId to its id and set location to the canonical name. Otherwise set spotId to null.
${formatSpotsForPrompt(spots)}

Respond with ONLY the JSON object. No prose, no markdown fences.`;

    const userMessage = `Parse this catch description:\n\n${description}`;

    const openAiRequestPayload = {
      model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userMessage },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' as const },
    };

    debugLog('OpenAI request payload:', {
      model: openAiRequestPayload.model,
      temperature: openAiRequestPayload.temperature,
      spotCount: spots.length,
      messages: openAiRequestPayload.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const completion = await openai.chat.completions.create(openAiRequestPayload);
    debugLog('Raw OpenAI response:', completion);

    const responseText = completion.choices?.[0]?.message?.content;
    debugLog('OpenAI response text:', responseText);

    if (!responseText) {
      return NextResponse.json(
        {
          error: 'Failed to get response from OpenAI',
          details: 'OpenAI returned no message content.',
        },
        { status: 500 }
      );
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(responseText);
      debugLog('Parsed OpenAI JSON:', parsedData);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', {
        responseText,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return NextResponse.json(
        { error: 'Invalid JSON response from AI', details: responseText },
        { status: 500 }
      );
    }

    const validation = catchSchema.safeParse(parsedData);
    debugLog('Zod validation result:', validation.success ? 'success' : validation.error.issues);

    if (!validation.success) {
      console.error('Validation errors:', validation.error.issues);
      return NextResponse.json(
        {
          error: 'Parsed data does not match expected schema',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const resolvedSpotId =
      validation.data.spotId != null && validSpotIds.has(validation.data.spotId)
        ? validation.data.spotId
        : null;

    return NextResponse.json({ ...validation.data, spotId: resolvedSpotId });
  } catch (error) {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const stack = isError ? error.stack : undefined;

    console.error('Error parsing catch:', { message, stack });

    return NextResponse.json(
      { error: 'AI parsing failed', details: message },
      { status: 500 }
    );
  }
}
