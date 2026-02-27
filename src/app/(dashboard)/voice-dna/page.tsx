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

  const handleAnalyze = () => {
    if (isEmpty || isAnalyzing) {
      return;
    }

    setIsAnalyzed(false);
    setIsAnalyzing(true);
    setProgress(0);

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 5, 100);
        if (next === 100) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
          }
          setIsAnalyzing(false);
          setIsAnalyzed(true);
        }
        return next;
      });
    }, 100);
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
    if (!isAnalyzing) {
      return "Analysis complete.";
    }
    if (progress < 35) {
      return progressMessages[0];
    }
    if (progress < 70) {
      return progressMessages[1];
    }
    return progressMessages[2];
  }, [isAnalyzing, progress]);

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
              Review the latest posts we found before building your Voice DNA.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockPosts.map((post) => (
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
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button size="lg" isLoading={isConfirming} onClick={handleConfirm}>
              Confirm and Build My DNA
            </Button>
            <p className="text-xs text-[var(--foreground-muted)]">
              This will take you back to your dashboard once the setup is done.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
