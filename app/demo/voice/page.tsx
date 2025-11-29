"use client";

import { useState, useRef } from 'react';
import { GlassButton } from "@/components/ui/glass-button";
import {
  GradientBackground,
  gradientPresets,
} from "@/components/ui/gradient-background";
import { GrainOverlay } from "@/components/ui/grain-overlay";

export default function VoiceDemoPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);

    // Revoke previous audio URL to free memory
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GradientBackground colors={gradientPresets.midnightBlue} />
      <GrainOverlay />

      <main className="relative z-10 flex min-h-screen flex-col items-center gap-8 p-8 pt-16">
        <h1 className="text-4xl font-bold text-white">Voice Demo</h1>

        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
          <textarea
            className="w-full h-32 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            placeholder="Enter text to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex justify-center">
            <GlassButton type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Audio'}
            </GlassButton>
          </div>
        </form>

        {error && (
          <div className="w-full max-w-xl p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-white/70 text-center">
            <p>Generating audio...</p>
          </div>
        )}

        {audioUrl && (
          <div className="w-full max-w-xl p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-white/80 mb-4 text-center">Your generated audio:</p>
            <audio
              ref={audioRef}
              controls
              className="w-full"
              src={audioUrl}
            />
          </div>
        )}
      </main>
    </>
  );
}
