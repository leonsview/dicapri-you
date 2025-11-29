import { NextRequest, NextResponse } from 'next/server';
import { MovieDirector } from './MovieDirector';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  console.log('🎬 Starting movie generation...');
  
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: 'Apify API token not configured' },
        { status: 500 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    const director = new MovieDirector(APIFY_TOKEN, GEMINI_API_KEY);
    const finalVideo = await director.createMovie(linkedinUrl);

    return NextResponse.json({ 
      success: true,
      videoUrl: finalVideo 
    });

  } catch (error) {
    console.error('Movie generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Movie generation failed' },
      { status: 500 }
    );
  }
}

