import { cleanLinkedInProfile, LinkedInProfileRaw, LinkedInProfileClean } from '@/lib/linkedin';

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyRunStatus {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

export class LinkedinScraper {
  private apiToken: string;
  private actorId: string = 'dev_fusion~linkedin-profile-scraper';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  public async scrape(linkedinUrl: string): Promise<LinkedInProfileClean> {
    if (!linkedinUrl) {
      throw new Error('LinkedIn URL is required');
    }

    // Validate LinkedIn URL format
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      throw new Error('Invalid LinkedIn profile URL');
    }

    // Start the scraper run
    const startResponse = await fetch(
      `https://api.apify.com/v2/acts/${this.actorId}/runs?token=${this.apiToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl],
        }),
      }
    );

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start scraper: ${errorText}`);
    }

    const runData: ApifyRunResponse = await startResponse.json();
    const runId = runData.data.id;

    // Wait for the run to complete
    const datasetId = await this.waitForRunCompletion(runId);

    // Get the results
    const scrapedData = (await this.getDatasetItems(datasetId))[0] as LinkedInProfileRaw;

    console.log('scraped linkedin Data: ', scrapedData);

    const cleanedProfile = cleanLinkedInProfile(scrapedData);

    console.log('cleaned profile: ', cleanedProfile);

    return cleanedProfile;
  }

  private async waitForRunCompletion(runId: string): Promise<string> {
    const maxAttempts = 60; // 2 minutes max wait
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiToken}`
      );

      if (!response.ok) {
        throw new Error(`Failed to check run status: ${response.statusText}`);
      }

      const data: ApifyRunStatus = await response.json();

      if (data.data.status === 'SUCCEEDED') {
        return data.data.defaultDatasetId;
      }

      if (data.data.status === 'FAILED' || data.data.status === 'ABORTED') {
        throw new Error(`Scraper run ${data.data.status.toLowerCase()}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Scraper timed out');
  }

  private async getDatasetItems(datasetId: string): Promise<unknown[]> {
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${this.apiToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }

    return response.json();
  }
}
