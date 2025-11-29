"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { DiCaprioMarquee } from "../dicaprio-marquee";
import { validateLinkedInUrl } from "../utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;

function isBelaWiertzProfile(url: string): boolean {
  const normalized = url.toLowerCase().replace(/\/$/, "");
  return normalized.includes("linkedin.com/in/bela-wiertz");
}

export default function DemoPage() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let normalizedUrl: string;

    try {
      normalizedUrl = validateLinkedInUrl(linkedinUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL");
      return;
    }

    // Check if it's Bela Wiertz's profile
    if (!isBelaWiertzProfile(normalizedUrl)) {
      setError("Demo only works with Bela Wiertz's LinkedIn profile");
      return;
    }

    setLoading(true);
    setError(null);

    // Fake 32 second delay
    await new Promise((resolve) => setTimeout(resolve, 32000));

    setGeneratedVideo("https://ubioqzowbvhigmxygqpn.supabase.co/storage/v1/object/public/videos/Bela%20the%20movie.mp4");
    setShowDialog(true);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Marquee */}
      <div className="fixed inset-0 z-0">
        <DiCaprioMarquee />
      </div>

      {/* Subtle overlay to enhance glass effect visibility */}
      <div className="fixed inset-0 z-1 bg-linear-to-b from-black/20 via-transparent to-black/20" />

      {/* Grain overlay for texture */}
      <GrainOverlay />

      {/* Main Content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <div className="mb-24 w-full max-w-2xl space-y-12">
          {/* Title */}
          <div className="space-y-3 text-center">
            <h1 className="font-bold text-8xl text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              DiCapri-You
            </h1>
            <p className="font-light text-4xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              Be the star of the show
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <GlassInput
                className="flex-1"
                placeholder="Your LinkedIn profile URL..."
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />

              <GlassButton
                contentClassName="px-6 py-3 text-sm"
                size="default"
                type="submit"
                disabled={loading}
              >
                {loading ? "Generating..." : "Submit"}
              </GlassButton>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {/* Loading Message */}
            {loading && (
              <p className="text-white/70 text-sm text-center">
                Cooking your video... This takes about 30 seconds.
              </p>
            )}
          </form>
        </div>
      </main>

      {/* Video Display Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Your Generated Video</DialogTitle>
          </DialogHeader>
          {generatedVideo ? (
            <div className="flex justify-center">
              <video
                src={generatedVideo}
                controls
                autoPlay
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <p className="text-white/70 text-center">No video URL configured</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
