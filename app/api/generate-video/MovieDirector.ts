import { LinkedinScraper } from './LinkedinScraper';
import { GeminiMediaGenerator } from './GeminiMediaGenerator';
import * as fs from 'fs';
import * as path from 'path';

interface SceneData {
  prompt: string;
  movie_reference_image: string;
  person_reference_image: string;
}

interface GeneratedImage {
  scene: string;
  imageUrl: string;
}

interface GeneratedVideo {
  scene: string;
  videoUrl: string;
}

export class MovieDirector {
  private scraper: LinkedinScraper;
  private generator: GeminiMediaGenerator;
  private dicaprioScenes: Record<string, SceneData>;

  constructor(apifyToken: string, geminiApiKey: string) {
    this.scraper = new LinkedinScraper(apifyToken);
    this.generator = new GeminiMediaGenerator(geminiApiKey);
    
    // Load scene data
    const dicaprioInputPath = path.join(process.cwd(), 'prompting', 'dicaprio-input.json');
    this.dicaprioScenes = JSON.parse(fs.readFileSync(dicaprioInputPath, 'utf-8'));
  }

  async createMovie(linkedinUrl: string): Promise<string> {
    // Step 1: Scrape LinkedIn profile
    console.log('🎬 Step 1: Scraping LinkedIn profile...');
    const profile = await this.scraper.scrape(linkedinUrl);
    
    if (!profile.profilePicHighQuality) {
      throw new Error('No profile picture found');
    }

    // Step 2: Generate all images in parallel
    console.log('🎬 Step 2: Generating images in parallel...');
    const images = await this.generateImages(profile.profilePicHighQuality);

    // Step 3: Generate videos from Nano Banana images in parallel
    console.log('🎬 Step 3: Generating videos in parallel...');
    const videos = await this.generateVideos(images);

    // Step 4: Stitch all videos together
    console.log('🎬 Step 4: Stitching videos together...');
    const finalVideo = await this.stitchVideos(videos);

    console.log('✅ Movie complete!');
    return finalVideo;
  }

  private async generateImages(profilePic: string): Promise<GeneratedImage[]> {
    const sceneEntries = Object.entries(this.dicaprioScenes);
    
    const imagePromises = sceneEntries.map(async ([sceneName, sceneData], index) => {
      console.log(`  🎨 Generating image for scene: ${sceneName}`);
      
      const referenceImages = [sceneData.movie_reference_image, profilePic];
      const imageUrl = await this.generator.GenerateWithNanoBananPro(referenceImages, sceneData.prompt);
      
      console.log(`  ✅ Generated image for ${sceneName}`);
      
      return {
        scene: sceneName,
        imageUrl,
        index // Preserve order
      };
    });

    const results = await Promise.all(imagePromises);
    
    // Sort by original index to maintain order
    results.sort((a, b) => a.index - b.index);
    
    return results.map(({ scene, imageUrl }) => ({ scene, imageUrl }));
  }

  private async generateVideos(images: GeneratedImage[]): Promise<GeneratedVideo[]> {
    const videoPromises = images.map(async (image, index) => {
      console.log(`  🎥 Generating video for scene: ${image.scene}`);
      
      // Get the prompt for this scene (same as used for image generation)
      const sceneData = this.dicaprioScenes[image.scene];
      if (!sceneData) {
        throw new Error(`Scene data not found for: ${image.scene}`);
      }
      
      // Use the Nano Banana generated image (one video per image)
      // GenerateWithVeo now returns a data URL string directly
      const videoDataUrl = await this.generator.GenerateWithVeo([image.imageUrl], sceneData.prompt);
      
      console.log(`  ✅ Generated video for ${image.scene}`);
      
      return {
        scene: image.scene,
        videoUrl: videoDataUrl,
        index // Preserve order
      };
    });

    const results = await Promise.all(videoPromises);
    
    // Sort by original index to maintain order
    results.sort((a, b) => a.index - b.index);
    
    return results.map(({ scene, videoUrl }) => ({ scene, videoUrl }));
  }

  private async stitchVideos(videos: GeneratedVideo[]): Promise<string> {
    // TODO: Stitch all videos together in order
    // For now, return the first video URL as a temporary solution
    console.log('    [TODO] Stitching videos:', videos.map(v => v.scene).join(', '));
    
    if (videos.length === 0) {
      throw new Error('No videos to stitch');
    }
    
    // Return the first video URL (temporary until stitching is implemented)
    const firstVideoUrl = videos[0].videoUrl;
    console.log('    📹 Returning first video:', firstVideoUrl);
    
    return firstVideoUrl;
  }
}
