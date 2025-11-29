import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { fal } from "@fal-ai/client";
import { writeFile, mkdir, readdir, readFile } from "fs/promises";
import { join } from "path";

export class GeminiMediaGenerator {
  private ai: GoogleGenAI;
  private readonly generatedMediaPath: string;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.generatedMediaPath = join(process.cwd(), "generatedMedia");
  }

  private async ensureGeneratedMediaDir(): Promise<void> {
    try {
      await mkdir(this.generatedMediaPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private async saveImage(base64Data: string, filename: string): Promise<string> {
    await this.ensureGeneratedMediaDir();
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");
    const filePath = join(this.generatedMediaPath, filename);
    await writeFile(filePath, buffer);
    console.log(`💾 Saved image to: ${filePath}`);
    return filePath;
  }

  private async saveVideo(videoData: any, filename: string): Promise<string> {
    await this.ensureGeneratedMediaDir();
    // Video data might be a URL or bytes - handle accordingly
    let buffer: Buffer;
    
    if (videoData.uri) {
      // If it's a URI, fetch it
      const response = await fetch(videoData.uri);
      buffer = Buffer.from(await response.arrayBuffer());
    } else if (videoData.bytes) {
      // If it's bytes directly
      buffer = Buffer.from(videoData.bytes);
    } else {
      throw new Error("Video data format not recognized");
    }
    
    const filePath = join(this.generatedMediaPath, filename);
    await writeFile(filePath, buffer);
    console.log(`💾 Saved video to: ${filePath}`);
    return filePath;
  }

  private async getExistingImage(): Promise<string | null> {
    try {
      await this.ensureGeneratedMediaDir();
      const files = await readdir(this.generatedMediaPath);
      
      // Filter for image files
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
      );

      if (imageFiles.length === 0) {
        return null;
      }

      // Get the first image
      const firstImage = imageFiles[0];
      const imagePath = join(this.generatedMediaPath, firstImage);
      
      console.log(`📁 Found existing image: ${firstImage}`);
      
      // Read the image and convert to data URL
      const buffer = await readFile(imagePath);
      const base64 = buffer.toString('base64');
      
      // Determine mime type from extension
      const ext = firstImage.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : 
                       ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                       ext === 'gif' ? 'image/gif' :
                       ext === 'webp' ? 'image/webp' : 'image/png';
      
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return dataUrl;
    } catch (error) {
      console.log('No existing images found or error reading directory:', error);
      return null;
    }
  }

  private async getExistingVideo(): Promise<string | null> {
    try {
      await this.ensureGeneratedMediaDir();
      const files = await readdir(this.generatedMediaPath);
      
      // Filter for video files
      const videoFiles = files.filter(file => 
        /\.(mp4|mov|avi|webm|mkv)$/i.test(file)
      );

      if (videoFiles.length === 0) {
        return null;
      }

      // Get the first video
      const firstVideo = videoFiles[0];
      const videoPath = join(this.generatedMediaPath, firstVideo);
      
      console.log(`📁 Found existing video: ${firstVideo}`);
      
      // Read the video file and convert to data URL
      const buffer = await readFile(videoPath);
      const base64 = buffer.toString('base64');
      
      // Determine mime type from extension
      const ext = firstVideo.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'mp4' ? 'video/mp4' : 
                       ext === 'mov' ? 'video/quicktime' :
                       ext === 'webm' ? 'video/webm' :
                       ext === 'avi' ? 'video/x-msvideo' :
                       ext === 'mkv' ? 'video/x-matroska' : 'video/mp4';
      
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return dataUrl;
    } catch (error) {
      console.log('No existing videos found or error reading directory:', error);
      return null;
    }
  }

  public async GenerateWithNanoBananPro(imageReferences: string[], prompt: string): Promise<string> {
    console.log('🚀 Generating with Nano Banana (Fal.ai)...', { prompt, imageReferences });

    // Check if there's an existing image in the generatedMedia folder
    const existingImage = await this.getExistingImage();
    if (existingImage) {
      console.log('✅ Using existing image from cache instead of generating new one');
      return existingImage;
    }

    try {
      const result: any = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          prompt: prompt,
          image_urls: imageReferences,
          aspect_ratio: "16:9",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('Fal result:', result);

      // The result.data structure depends on the model. 
      // Assuming standard Fal image response or checking the logs/result.
      // For nano-banana/edit, it likely returns 'image' or 'images'.
      // Based on user example, we just log result.data. 
      // I will assume it returns an object with an 'image' property containing 'url'.
      // If not, we might need to adjust.
      
      let imageUrl: string;
      if (result.data?.image?.url) {
        imageUrl = result.data.image.url;
      } else if (result.data?.images?.[0]?.url) {
        imageUrl = result.data.images[0].url;
      } else {
        // Fallback: try to find any URL in the data
        console.warn('Could not find standard image URL in Fal response, inspecting data...');
        const possibleUrl = JSON.stringify(result.data).match(/https?:\/\/[^"]+/)?.[0];
        if (possibleUrl) {
          imageUrl = possibleUrl;
        } else {
           throw new Error('No image URL found in Fal response');
        }
      }

      console.log('✅ Fal returned image URL:', imageUrl);

      // Fetch the image to convert to base64 and save locally
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch generated image from Fal: ${imageUrl}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const timestamp = Date.now();
      const filename = `image-${timestamp}.png`;
      await this.saveImage(dataUrl, filename);

      return dataUrl;

    } catch (error) {
      console.error('❌ Fal generation failed:', error);
      throw error;
    }
  }

  public async GenerateWithVeo(imageReferences: string[], prompt: string): Promise<string> {
    console.log('🎬 Starting Veo video generation (Fal.ai)...', { prompt, imageCount: imageReferences.length });

    // Check if there's an existing video in the generatedMedia folder
    const existingVideo = await this.getExistingVideo();
    if (existingVideo) {
      console.log('✅ Using existing video from cache instead of generating new one');
      return existingVideo;
    }

    // Get the first reference image (Veo typically uses one reference image)
    if (imageReferences.length === 0) {
      throw new Error('At least one reference image is required for Veo video generation');
    }

    const imageReference = imageReferences[0];
    let imageUrl: string;

    // Handle base64 data URLs (from Nano Banana) or regular URLs
    if (imageReference.startsWith('data:')) {
      // For data URLs, we need to upload to a temporary location or use the URL directly
      // Fal expects a URL, so we'll need to convert this to a URL
      // For now, let's assume we can use the data URL directly or we need to upload it
      // Since Fal expects image_url, we might need to handle this differently
      console.warn('⚠️ Data URL detected - Fal expects a URL. Consider uploading the image first.');
      imageUrl = imageReference; // Try passing it directly, may need adjustment
    } else {
      imageUrl = imageReference;
    }

    try {
      console.log('🎥 Generating video with Veo 3.1 via Fal...');
      const result: any = await fal.subscribe("fal-ai/veo3.1/fast/image-to-video", {
        input: {
          prompt: "make it cinematic and dynamic. the character should NOT talk, and the camera movements should be clearly visible.",
          image_url: imageUrl
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('✅ Fal Veo result:', result);

      // Extract video URL from the result
      let videoUrl: string;
      if (result.data?.video?.url) {
        videoUrl = result.data.video.url;
      } else if (result.data?.url) {
        videoUrl = result.data.url;
      } else {
        // Fallback: try to find any video URL in the data
        console.warn('Could not find standard video URL in Fal response, inspecting data...');
        const possibleUrl = JSON.stringify(result.data).match(/https?:\/\/[^"]+\.mp4/)?.[0];
        if (possibleUrl) {
          videoUrl = possibleUrl;
        } else {
          throw new Error('No video URL found in Fal response');
        }
      }

      console.log('✅ Fal returned video URL:', videoUrl);

      // Fetch the video and save locally
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Failed to fetch generated video from Fal: ${videoUrl}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const timestamp = Date.now();
      const filename = `video-${timestamp}.mp4`;
      const filePath = join(this.generatedMediaPath, filename);
      
      await this.ensureGeneratedMediaDir();
      await writeFile(filePath, buffer);
      console.log(`💾 Saved video to: ${filePath}`);

      // Convert to data URL for frontend display
      const base64 = buffer.toString('base64');
      const dataUrl = `data:video/mp4;base64,${base64}`;
      
      return dataUrl;

    } catch (error) {
      console.error('❌ Fal Veo generation failed:', error);
      throw error;
    }
  }
}
