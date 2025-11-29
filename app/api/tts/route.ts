import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY || !process.env.VOICE_ID_MORGAN) {
      return NextResponse.json(
        { error: 'ElevenLabs API key or voice ID not configured' },
        { status: 500 }
      );
    }

    const voiceId = process.env.VOICE_ID_MORGAN;

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_v3',
      outputFormat: 'mp3_44100_128',
    });

    // Convert ReadableStream to ArrayBuffer
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
