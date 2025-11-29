import { NextRequest, NextResponse } from 'next/server';
import { LinkedinScraper } from '../generate-video/LinkedinScraper';
import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
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

    // Step 1: Scrape LinkedIn profile
    console.log('Step 1: Scraping LinkedIn profile...');
    const scraper = new LinkedinScraper(APIFY_TOKEN);
    const cleanedProfile = await scraper.scrape(linkedinUrl);
    console.log('LinkedIn profile scraped successfully');

    // Step 2: Read the system prompt
    console.log('Step 2: Reading system prompt...');
    const promptPath = path.join(process.cwd(), 'prompting', 'agent-system-prompt-v1.md');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log('System prompt loaded');

    // Step 3: Call Gemini API
    console.log('Step 3: Calling Gemini 3 API...');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate the movie script JSON for this LinkedIn profile:\n\n${JSON.stringify(cleanedProfile, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    console.log('Gemini response received');

    // Parse the response - extract JSON from markdown code blocks if present
    let responseText = response.text || '';

    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      responseText = jsonMatch[1].trim();
    }

    let scriptJson;
    try {
      scriptJson = JSON.parse(responseText);
    } catch {
      // If parsing fails, return the raw text
      return NextResponse.json({
        success: true,
        profile: cleanedProfile,
        script: responseText,
        parseError: 'Could not parse response as JSON'
      });
    }

    return NextResponse.json({
      success: true,
      profile: cleanedProfile,
      script: scriptJson
    });

  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Script generation failed' },
      { status: 500 }
    );
  }
}
