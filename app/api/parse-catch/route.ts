import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { catchSchema } from '@/lib/catch-schema';

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const requestBody = await request.json();
    console.log('Incoming parse-catch request body:', requestBody);

    const { description } = requestBody;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required', details: 'The request body must include a non-empty description string.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Danish fishing log assistant. Parse the user's natural language description of a fish catch and extract the relevant information.

Return a JSON object with these fields:
- date: string (dd/mm/yyyy format) - leave empty if not provided
- location: string (fishing location/spot name)
- fjord: string (name of fjord) - leave empty if not mentioned
- bait: string (type of bait used)
- lengthCm: number | null (fish length in cm)
- undersized: boolean (whether fish was undersized)
- windDirection: string (wind direction if mentioned) - leave empty if not mentioned
- notes: string (any additional notes about the catch)

Only include information that can be inferred from the description. Use null or empty strings for unknown values.
Respond ONLY with valid JSON, no additional text.`;

    const userMessage = `Parse this catch description and extract the information:

${description}`;

    const openAiRequestPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
    };

    console.log('OpenAI request payload:', {
      model: openAiRequestPayload.model,
      temperature: openAiRequestPayload.temperature,
      messages: openAiRequestPayload.messages.map((message) => ({ role: message.role, content: message.content })),
    });

    const completion = await openai.chat.completions.create(openAiRequestPayload as any);
    console.log('Raw OpenAI response:', completion);

    const responseText = completion.choices?.[0]?.message?.content;
    console.log('OpenAI response text:', responseText);

    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to get response from OpenAI', details: 'OpenAI returned no message content.' },
        { status: 500 }
      );
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
      console.log('Parsed OpenAI JSON:', parsedData);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', {
        responseText,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
      });
      return NextResponse.json(
        {
          error: 'Invalid JSON response from AI',
          details: responseText,
        },
        { status: 500 }
      );
    }

    const validation = catchSchema.safeParse(parsedData);
    console.log('Zod validation result:', validation.success ? 'success' : validation.error.issues);

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

    return NextResponse.json(validation.data);
  } catch (error) {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const stack = isError ? error.stack : undefined;

    console.error('Error parsing catch:', {
      message,
      stack,
      error,
    });

    return NextResponse.json(
      {
        error: 'AI parsing failed',
        details: message,
        stack,
      },
      { status: 500 }
    );
  }
}
