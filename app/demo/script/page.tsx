"use client";

import { useState, useRef } from 'react';
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import {
  GradientBackground,
  gradientPresets,
} from "@/components/ui/gradient-background";
import { GrainOverlay } from "@/components/ui/grain-overlay";

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface Step {
  label: string;
  status: StepStatus;
}

interface ScriptResult {
  success: boolean;
  profile: unknown;
  script: {
    voiceover?: {
      fixed_intro?: string;
      origin_story?: string;
    };
    dicaprio_scenes?: string[];
    image_prompts?: string[];
  };
  parseError?: string;
}

export default function ScriptDemoPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<unknown>(null);
  const [script, setScript] = useState<ScriptResult['script'] | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Scraping LinkedIn profile', status: 'pending' },
    { label: 'Generating script with Gemini 3', status: 'pending' },
    { label: 'Generating voiceover audio', status: 'pending' },
    { label: 'Stitching video with audio', status: 'pending' },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ffmpegRef = useRef<any>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const updateStep = (index: number, status: StepStatus) => {
    setSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, status } : step
    ));
  };

  const resetSteps = () => {
    setSteps([
      { label: 'Scraping LinkedIn profile', status: 'pending' },
      { label: 'Generating script with Gemini 3', status: 'pending' },
      { label: 'Generating voiceover audio', status: 'pending' },
      { label: 'Stitching video with audio', status: 'pending' },
    ]);
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    // Dynamic imports to avoid Next.js/Turbopack bundling issues
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    // Load from CDN with proper CORS headers using UMD bundle
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const stitchVideoWithAudio = async (audioBlob: Blob) => {
    const ffmpeg = await loadFFmpeg();
    const { fetchFile } = await import('@ffmpeg/util');

    // Fetch the test video
    const videoData = await fetchFile('/test/test_video.mp4');
    await ffmpeg.writeFile('video.mp4', videoData);

    // Write audio file
    const audioData = new Uint8Array(await audioBlob.arrayBuffer());
    await ffmpeg.writeFile('audio.mp3', audioData);

    // Combine video + audio
    await ffmpeg.exec([
      '-i', 'video.mp4',
      '-i', 'audio.mp3',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      'output.mp4'
    ]);

    // Read output and convert to Blob
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([(data as { buffer: ArrayBuffer }).buffer ?? data], { type: 'video/mp4' });
    return URL.createObjectURL(blob);
  };

  const handleGenerate = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter a LinkedIn profile URL');
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);
    setScript(null);
    setAudioUrl(null);
    setVideoUrl(null);
    resetSteps();

    try {
      // Step 1 & 2: Scraping and generating script
      updateStep(0, 'in_progress');

      const response = await fetch('/api/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data: ScriptResult = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || 'Failed to generate script');
      }

      updateStep(0, 'completed');
      updateStep(1, 'completed');

      setProfile(data.profile);
      setScript(data.script);

      // Step 3: Generate TTS for origin_story
      const originStory = data.script?.voiceover?.origin_story;
      if (originStory) {
        updateStep(2, 'in_progress');

        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: originStory }),
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          audioBlobRef.current = audioBlob;
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          updateStep(2, 'completed');

          // Step 4: Stitch video with audio
          updateStep(3, 'in_progress');
          try {
            const stitchedVideoUrl = await stitchVideoWithAudio(audioBlob);
            setVideoUrl(stitchedVideoUrl);
            updateStep(3, 'completed');
          } catch (stitchError) {
            console.error('Video stitching error:', stitchError);
            updateStep(3, 'error');
          }
        } else {
          updateStep(2, 'error');
        }
      } else {
        updateStep(2, 'error');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      const inProgressStep = steps.findIndex(s => s.status === 'in_progress');
      if (inProgressStep >= 0) {
        updateStep(inProgressStep, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return <span className="text-white/40">○</span>;
      case 'in_progress':
        return <span className="text-yellow-400 animate-pulse">◐</span>;
      case 'completed':
        return <span className="text-green-400">✓</span>;
      case 'error':
        return <span className="text-red-400">✗</span>;
    }
  };

  return (
    <>
      <GradientBackground colors={gradientPresets.midnightBlue} />
      <GrainOverlay />

      <main className="relative z-10 flex min-h-screen flex-col items-center gap-8 p-8 pt-16">
        <h1 className="text-4xl font-bold text-white">Script Generator Demo</h1>
        <p className="text-white/70 text-center max-w-xl">
          Enter a LinkedIn URL to generate a movie script using Gemini 3
        </p>

        {/* Input Section */}
        <div className="w-full max-w-xl flex flex-col gap-4">
          <GlassInput
            placeholder="Enter LinkedIn profile URL (e.g., https://linkedin.com/in/username)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
          <div className="flex justify-center">
            <GlassButton onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Script'}
            </GlassButton>
          </div>
        </div>

        {/* Progress Steps */}
        {(loading || profile || script) && (
          <div className="w-full max-w-xl p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-3">Progress</h3>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-white/80">
                  <span className="text-xl">{getStatusIcon(step.status)}</span>
                  <span className={step.status === 'completed' ? 'text-green-300' : ''}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error !== null ? (
          <div className="w-full max-w-xl p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
            {error}
          </div>
        ) : null}

        {/* Loading State */}
        {loading ? (
          <div className="text-white/70 text-center">
            <p>This may take 2-3 minutes...</p>
          </div>
        ) : null}

        {/* Final Video */}
        {videoUrl !== null ? (
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Final Video</h2>
            <video controls className="w-full rounded-lg">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video element.
            </video>
            <a
              href={videoUrl}
              download="dicapri-you-video.mp4"
              className="mt-4 inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
            >
              Download Video
            </a>
          </div>
        ) : null}

        {/* Results - Two Cards */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: LinkedIn Profile */}
          {profile !== null ? (
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">LinkedIn Profile</h2>
              <pre className="text-xs text-white/70 overflow-auto max-h-[400px] whitespace-pre-wrap">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          ) : null}

          {/* Card 2: Generated Script */}
          {script !== null ? (
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Generated Script</h2>
              <pre className="text-xs text-white/70 overflow-auto max-h-[400px] whitespace-pre-wrap">
                {JSON.stringify(script, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        {/* Audio Player */}
        {audioUrl !== null ? (
          <div className="w-full max-w-xl p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Voiceover Audio</h2>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            {script?.voiceover?.origin_story && (
              <p className="mt-4 text-sm text-white/60 italic">
                &quot;{script.voiceover.origin_story}&quot;
              </p>
            )}
          </div>
        ) : null}
      </main>
    </>
  );
}
