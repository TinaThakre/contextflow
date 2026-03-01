"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";

type Platform = "IG" | "X" | "LinkedIn";

type PostPreview = {
  id: string;
  platform: Platform;
  type: "image" | "text";
  title: string;
};

const mockPosts: PostPreview[] = [
  { id: "post-1", platform: "IG", type: "image", title: "Studio reel" },
  { id: "post-2", platform: "X", type: "text", title: "Launch thread" },
  { id: "post-3", platform: "LinkedIn", type: "text", title: "Founder note" },
  { id: "post-4", platform: "IG", type: "image", title: "Behind the scenes" },
  { id: "post-5", platform: "X", type: "text", title: "Weekly insight" },
  { id: "post-6", platform: "LinkedIn", type: "image", title: "Event recap" },
  { id: "post-7", platform: "IG", type: "text", title: "Caption draft" },
  { id: "post-8", platform: "X", type: "image", title: "Studio snapshot" },
  { id: "post-9", platform: "LinkedIn", type: "text", title: "Case study" },
  { id: "post-10", platform: "IG", type: "image", title: "Moodboard" },
  { id: "post-11", platform: "X", type: "text", title: "Growth note" },
  { id: "post-12", platform: "LinkedIn", type: "image", title: "Team spotlight" },
];

const platformBadgeStyles: Record<Platform, string> = {
  IG: "bg-pink-500/15 text-pink-200 border-pink-400/30",
  X: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  LinkedIn: "bg-blue-500/15 text-blue-200 border-blue-400/30",
};

const progressMessages = [
  "Analyzing tone patterns...",
  "Extracting writing style...",
  "Building linguistic profile...",
];

export default function VoiceDnaPage() {
  const router = useRouter();
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scrapedPosts, setScrapedPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voiceDNAStatus, setVoiceDNAStatus] = useState<'idle' | 'scraping' | 'generating' | 'complete' | 'error'>('idle');
  const [generatedPlatforms, setGeneratedPlatforms] = useState<string[]>([]);

  const intervalRef = useRef<number | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (confirmTimerRef.current) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const isEmpty = !instagram.trim() && !twitter.trim() && !linkedIn.trim();

  const handleAnalyze = async () => {
    if (isEmpty || isAnalyzing) {
      return;
    }

    setIsAnalyzed(false);
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setScrapedPosts([]);
    setVoiceDNAStatus('scraping');
    setGeneratedPlatforms([]);

    try {
      // Get Firebase auth token
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("Please log in to continue");
      }

      const idToken = await auth.currentUser.getIdToken();

      // Prepare platforms data
      const platforms = [];
      if (instagram.trim()) {
        platforms.push({ platform: 'instagram', username: instagram.trim().replace('@', '') });
      }
      if (twitter.trim()) {
        platforms.push({ platform: 'twitter', username: twitter.trim().replace('@', '') });
      }
      if (linkedIn.trim()) {
        platforms.push({ platform: 'linkedin', username: linkedIn.trim() });
      }

      // Start progress animation
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + 1.5, 85));
      }, 100);

      // Call unified analyze API (combines scraping + Voice DNA generation)
      const response = await fetch("/api/voice-dna/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          platforms,
          limit: 50,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze social media");
      }

      const data = await response.json();
      
      console.log('Analysis Response:', data);
      console.log('Scraped Results:', data.data?.scraped);
      console.log('Voice DNA Results:', data.data?.voiceDNA);
      
      // Get generated platforms
      const generatedList: string[] = Object.entries(data.data?.voiceDNA || {})
        .filter(([_, result]: [string, any]) => result.id)
        .map(([platform]) => platform);

      setGeneratedPlatforms(generatedList);
      setProgress(100);
      
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      setIsAnalyzing(false);
      setIsAnalyzed(true);
      setVoiceDNAStatus('complete');
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze posts");
      setIsAnalyzing(false);
      setProgress(0);
      setVoiceDNAStatus('error');
      
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    }
  };

  const handleConfirm = () => {
    if (isConfirming) {
      return;
    }

    setIsConfirming(true);

    if (confirmTimerRef.current) {
      window.clearTimeout(confirmTimerRef.current);
    }

    confirmTimerRef.current = window.setTimeout(() => {
      router.push("/dashboard");
    }, 900);
  };

  const progressMessage = useMemo(() => {
    if (voiceDNAStatus === 'complete') {
      return "Analysis complete! Voice DNA created.";
    }
    if (voiceDNAStatus === 'error') {
      return "Error during analysis. Please try again.";
    }
    if (!isAnalyzing && voiceDNAStatus === 'idle') {
      return "Ready to analyze.";
    }
    
    // Progress-based messages for scraping and generation
    if (progress < 20) {
      return "Scraping social media posts...";
    }
    if (progress < 40) {
      return "Parsing and normalizing posts...";
    }
    if (progress < 60) {
      return "Extracting text patterns...";
    }
    if (progress < 80) {
      return "Generating Voice DNA profile...";
    }
    return "Finalizing analysis...";
  }, [isAnalyzing, progress, voiceDNAStatus]);

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold">
          Connect Your Digital Presence
        </h1>
        <p className="text-[var(--foreground-muted)] max-w-2xl mx-auto">
          Import your recent posts so we can understand your voice, tone, and style.
        </p>
      </div>

      <Card className="border-white/10 max-w-3xl mx-auto" padding="lg">
        <CardHeader>
          <CardTitle>Social handles</CardTitle>
          <CardDescription>
            Provide the profiles you want included in your Voice DNA analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
          <Input
            label="Instagram Username"
            placeholder="@creatorname"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
            disabled={isAnalyzing}
          />
          <Input
            label="Twitter Handle"
            placeholder="@creator"
            value={twitter}
            onChange={(event) => setTwitter(event.target.value)}
            disabled={isAnalyzing}
          />
          <Input
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/yourname"
            value={linkedIn}
            onChange={(event) => setLinkedIn(event.target.value)}
            disabled={isAnalyzing}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between border-white/10">
          <p className="text-xs text-[var(--foreground-muted)]">
            We only analyze public posts used to build your profile.
          </p>
          <Button onClick={handleAnalyze} disabled={isEmpty || isAnalyzing}>
            Analyze Posts
          </Button>
        </CardFooter>
      </Card>

      {(isAnalyzing || isAnalyzed) && (
        <Card className="border-white/10 max-w-3xl mx-auto" padding="lg">
          <CardHeader>
            <CardTitle>Import progress</CardTitle>
            <CardDescription>{progressMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-3 rounded-full bg-[var(--background-tertiary)] overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
              <span>{progress}% complete</span>
              <span>{isAnalyzing ? "Syncing posts" : "Ready"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isAnalyzed && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Post Preview</h2>
            <p className="text-[var(--foreground-muted)]">
              {scrapedPosts.length > 0 
                ? `Review ${scrapedPosts.length} posts we found before building your Voice DNA.`
                : "No posts found. Showing sample data."
              }
            </p>
            {scrapedPosts.length === 0 && (
              <p className="text-xs text-amber-400">
                Debug: scrapedPosts array is empty. Check browser console for API response.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {scrapedPosts.length > 0 ? (
              scrapedPosts.slice(0, 12).map((post) => {
                const platformMap: Record<string, Platform> = {
                  instagram: 'IG',
                  twitter: 'X',
                  linkedin: 'LinkedIn',
                };
                const displayPlatform = platformMap[post.platform] || 'IG';
                
                return (
                  <div
                    key={post.id}
                    className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs rounded-full border px-2 py-0.5 ${platformBadgeStyles[displayPlatform]}`}
                      >
                        {displayPlatform}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        Text
                      </span>
                    </div>
                    <div className="space-y-2 min-h-[60px]">
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-3">
                        {post.text || 'No text content'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.comments || 0}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              mockPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-3 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs rounded-full border px-2 py-0.5 ${platformBadgeStyles[post.platform]}`}
                    >
                      {post.platform}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {post.type === "image" ? "Image" : "Text"}
                    </span>
                  </div>
                  {post.type === "image" ? (
                    <div className="h-20 rounded-lg bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background)] border border-white/10" />
                  ) : (
                    <div className="space-y-2">
                      <div className="h-2 w-3/4 rounded-full bg-white/10" />
                      <div className="h-2 w-full rounded-full bg-white/10" />
                      <div className="h-2 w-2/3 rounded-full bg-white/10" />
                    </div>
                  )}
                  <p className="text-sm font-medium">{post.title}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            {voiceDNAStatus === 'complete' && generatedPlatforms.length > 0 ? (
              <>
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-semibold text-green-400">✓ Voice DNA Created!</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Successfully created Voice DNA for: {generatedPlatforms.join(', ')}
                  </p>
                </div>
                <Button size="lg" isLoading={isConfirming} onClick={handleConfirm}>
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" isLoading={isConfirming} onClick={handleConfirm}>
                  Confirm and Build My DNA
                </Button>
                <p className="text-xs text-[var(--foreground-muted)]">
                  This will take you back to your dashboard once the setup is done.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
