import { NextRequest, NextResponse } from 'next/server';
import { LinkedinScraper } from '../generate-video/LinkedinScraper';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: 'Apify API token not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { linkedinUrl } = body;

    const scraper = new LinkedinScraper(APIFY_TOKEN);

    try {
      // scraper.scrape() already returns a cleaned profile
      const cleanedProfile = await scraper.scrape(linkedinUrl);

      return NextResponse.json({ data: cleanedProfile });
    } catch (error) {
      if (error instanceof Error && (error.message === 'LinkedIn URL is required' || error.message === 'Invalid LinkedIn profile URL')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('LinkedIn scraper error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraper failed' },
      { status: 500 }
    );
  }
}
