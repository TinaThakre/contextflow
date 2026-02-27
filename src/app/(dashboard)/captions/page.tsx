"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";

const platforms = ["Instagram", "LinkedIn", "Twitter", "Threads"] as const;
const tones = [
  "Professional",
  "Casual",
  "Bold",
  "Storytelling",
  "Minimal",
] as const;

type Platform = (typeof platforms)[number];
type Tone = (typeof tones)[number];

const toneOpeners: Record<Tone, string> = {
  Professional: "Here is a concise update:",
  Casual: "Quick share:",
  Bold: "Hot take:",
  Storytelling: "Let me tell you a quick story:",
  Minimal: "Short and simple:",
};

const platformHashtags: Record<Platform, string> = {
  Instagram: "#creators #content",
  LinkedIn: "#leadership #growth",
  Twitter: "#buildinpublic #product",
  Threads: "#community #conversation",
};

const buildCaption = (idea: string, platform: Platform, tone: Tone) => {
  const trimmedIdea = idea.trim();
  const baseIdea = trimmedIdea || "a fresh update about your product";
  const opener = toneOpeners[tone];
  const hashtags = platformHashtags[platform];

  return `${opener} ${baseIdea}. ${hashtags}`;
};

export default function CaptionsPage() {
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [tone, setTone] = useState<Tone>("Professional");
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (generateTimerRef.current) {
        window.clearTimeout(generateTimerRef.current);
      }
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleGenerate = () => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setIsCopied(false);

    if (generateTimerRef.current) {
      window.clearTimeout(generateTimerRef.current);
    }

    generateTimerRef.current = window.setTimeout(() => {
      setCaption(buildCaption(idea, platform, tone));
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = async () => {
    if (!caption || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(caption);
    setIsCopied(true);

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }

    copyTimerRef.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">AI Caption Generator</h1>
        <p className="text-[var(--foreground-muted)] max-w-2xl">
          Create on-brand captions in seconds. Choose a platform, set the tone,
          and share a quick idea to generate polished copy ready to post.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Customize the caption you want to generate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                <span className="text-[var(--foreground-muted)]">Platform</span>
                <select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value as Platform)}
                  className="w-full rounded-xl border border-white/10 bg-[var(--background-tertiary)] px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {platforms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-[var(--foreground-muted)]">Tone</span>
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value as Tone)}
                  className="w-full rounded-xl border border-white/10 bg-[var(--background-tertiary)] px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {tones.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-[var(--foreground-muted)]">Post idea</span>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Share the idea, announcement, or update you want to post."
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-[var(--background-tertiary)] px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </label>

            <Button isLoading={isGenerating} onClick={handleGenerate} size="lg">
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Generated Caption</CardTitle>
            <CardDescription>Your ready-to-post copy appears here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[160px] rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 text-sm text-[var(--foreground)]">
              {caption ? (
                <p className="whitespace-pre-line">{caption}</p>
              ) : (
                <p className="text-[var(--foreground-muted)]">
                  Your generated caption will appear once you run the generator.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!caption || isGenerating}
            >
              {isCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              Regenerate
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
