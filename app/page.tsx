"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { DiCaprioMarquee } from "./dicaprio-marquee";
import { cleanLinkedInProfile, LinkedInProfileRaw } from "@/lib/linkedin";
import { useGenerateVideo } from "./hooks/useGenerateVideo";
import { validateLinkedInUrl } from "./utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showBrokePopup, setShowBrokePopup] = useState(false);
  const { generateVideo } = useGenerateVideo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      validateLinkedInUrl(linkedinUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL");
      return;
    }

    setError(null);
    setShowBrokePopup(true);
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
                {loading ? "Scraping..." : "Submit"}
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
                Cooking...
              </p>
            )}
          </form>
        </div>
      </main>

      {/* Video Display Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Your Generated Video</DialogTitle>
          </DialogHeader>
          {generatedVideo ? (
            <div className="flex justify-center">
              <video
                src={generatedVideo}
                controls
                autoPlay
                loop
                className="max-w-full h-auto rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="text-white/70 text-center p-4">
              No video available. Video path: {generatedVideo}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Broke Founders Popup */}
      <Dialog open={showBrokePopup} onOpenChange={setShowBrokePopup}>
        <DialogContent>
          <div className="flex flex-col gap-4">
            <p className="text-white/90 text-base leading-relaxed">
              We&apos;re broke founders, so unfortunately we cannot give it out for free to everyone, as it costs a lot of credits.
            </p>
            <p className="text-white/90 text-base leading-relaxed">
              If you really want to try it, reach out to{" "}
              <a
                href="mailto:mail@leonsandner.com"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                mail@leonsandner.com
              </a>
              {" "}and let us know how much you are willing to pay for such a banger personalized movie trailer, then we&apos;ll give you access :)
            </p>
            <img
              src="/broke-founders.jpeg"
              alt="Broke founders showing empty wallets"
              className="w-full rounded-xl mt-2"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
