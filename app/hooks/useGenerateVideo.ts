import { useState } from 'react';

export const useGenerateVideo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async (linkedinUrl: string) => {

    console.log('generating video for', linkedinUrl);
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate video');
      }

      const result = await response.json();
      return result.videoUrl; // Return the generated video URL
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error generating video:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { generateVideo, isLoading, error };
};
