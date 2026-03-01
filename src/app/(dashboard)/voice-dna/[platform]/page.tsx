"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceDNAProfile {
  id: string;
  platform: string;
  version: string;
  createdAt: number;
  lastUpdated: number;
  confidence: {
    overallConfidence: number;
    dataQuality: {
      sampleSize: number;
      dateRange: number;
      completeness: number;
    };
    analysisDepth: {
      textualAnalysis: number;
      visualAnalysis: number;
      correlationAnalysis: number;
    };
  };
  coreIdentity?: {
    primaryVoice?: {
      tone?: string;
      personality?: string[];
      communicationStyle?: string;
    };
    contentPillars?: Array<{
      pillar: string;
      weight: number;
      keywords: string[];
    }>;
    uniqueSignature?: {
      catchphrases?: string[];
      writingQuirks?: string[];
      visualSignature?: string;
    };
  };
  writingDNA?: {
    styleProfile?: {
      sentenceRhythm?: string;
      vocabularyLevel?: string;
      emotionalRange?: string[];
      punctuationPersonality?: string;
    };
    contentStructure?: {
      openingStyle?: string;
      bodyStructure?: string;
      closingStyle?: string;
      ctaPattern?: string;
    };
    linguisticPatterns?: {
      favoriteWords?: string[];
      phraseTemplates?: string[];
      metaphorStyle?: string;
      storytellingApproach?: string;
    };
  };
  strategyDNA?: {
    hashtagFormula?: {
      optimalCount?: number;
      categoryMix?: string[];
    };
    engagementDrivers?: {
      topTriggers?: string[];
      audiencePreferences?: string[];
      contentGaps?: string[];
    };
    contentFormula?: {
      winningCombinations?: Array<{
        visualStyle: string;
        captionApproach: string;
        timing: string;
        expectedPerformance: number;
      }>;
    };
  };
  behavioralDNA?: {
    postingBehavior?: {
      frequency?: string;
      consistency?: number;
      optimalTiming?: string[];
    };
  };
  generationTemplates?: {
    captionTemplates?: Array<{
      template: string;
      context: string;
      exampleOutput: string;
    }>;
    hashtagSets?: Array<{
      name: string;
      tags: string[];
      useCase: string;
    }>;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram:
    "from-pink-500/20 via-purple-500/10 to-transparent border-pink-500/20",
  twitter: "from-sky-500/20 via-blue-500/10 to-transparent border-sky-500/20",
  linkedin:
    "from-blue-600/20 via-blue-400/10 to-transparent border-blue-600/20",
};

function pct(v: number | undefined, digits = 0) {
  if (v === undefined || v === null) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagList({ items }: { items: string[] | undefined }) {
  if (!items?.length) return <span className="text-[var(--foreground-muted)] text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[var(--foreground-muted)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ConfidenceBar({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  const pctNum = value !== undefined ? Math.round(value * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-700"
          style={{ width: `${pctNum}%` }}
        />
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-[var(--foreground-muted)] shrink-0 w-40">{label}</span>
      <span className="text-xs text-right flex-1">{value ?? "—"}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VoiceDNAProfilePage() {
  const params = useParams();
  const router = useRouter();
  const platform = (params?.platform as string) ?? "";

  const [dna, setDna] = useState<VoiceDNAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  const gradientClass =
    PLATFORM_COLORS[platform] ?? "from-white/5 to-transparent border-white/10";

  // Validate platform client-side immediately
  const isValidPlatform = ["instagram", "twitter", "linkedin"].includes(platform);

  useEffect(() => {
    if (!isValidPlatform) {
      setError("Invalid platform. Supported: instagram, twitter, linkedin.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDNA() {
      try {
        const { auth } = await import("@/lib/firebase");
        if (!auth?.currentUser) {
          // Wait briefly for auth to initialise before giving up
          await new Promise((r) => setTimeout(r, 1200));
          if (!auth?.currentUser) {
            router.push("/login");
            return;
          }
        }

        const idToken = await auth.currentUser!.getIdToken();
        const res = await fetch(
          `/api/voice-dna/profile?platform=${encodeURIComponent(platform)}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || !json.success) {
          setError(json.message ?? "Failed to load Voice DNA.");
          setLoading(false);
          return;
        }

        setDna(json.data as VoiceDNAProfile);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Unexpected error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDNA();
    return () => {
      cancelled = true;
    };
  }, [platform, isValidPlatform, router]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Loading your Voice DNA…
          </p>
        </div>
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────
  if (error || !dna) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-5 max-w-sm">
          <div className="text-4xl">🧬</div>
          <h2 className="text-xl font-semibold">No Voice DNA Found</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            {error ??
              `No Voice DNA exists yet for ${platformLabel}. Generate one first.`}
          </p>
          <Button onClick={() => router.push("/voice-dna")}>
            Generate Voice DNA
          </Button>
        </div>
      </div>
    );
  }

  const { coreIdentity, writingDNA, strategyDNA, behavioralDNA, generationTemplates, confidence } = dna;

  // ── Full render ────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border bg-gradient-to-br p-6 ${gradientClass}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧬</span>
              <h1 className="text-2xl font-bold">{platformLabel} Voice DNA</h1>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Version {dna.version} &middot; Last updated {formatDate(dna.lastUpdated)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-3xl font-bold text-[var(--primary)]">
              {pct(confidence?.overallConfidence)}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Overall Confidence</p>
          </div>
        </div>
      </div>

      {/* ── Confidence Breakdown ────────────────────────────────── */}
      <Card className="border-white/10" padding="lg">
        <CardHeader>
          <CardTitle>Analysis Confidence</CardTitle>
          <CardDescription>How well we understand your voice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfidenceBar
            label="Overall Confidence"
            value={confidence?.overallConfidence}
          />
          <ConfidenceBar
            label="Data Quality — Sample Size"
            value={confidence?.dataQuality?.sampleSize}
          />
          <ConfidenceBar
            label="Data Quality — Completeness"
            value={confidence?.dataQuality?.completeness}
          />
          <ConfidenceBar
            label="Textual Analysis Depth"
            value={confidence?.analysisDepth?.textualAnalysis}
          />
          <ConfidenceBar
            label="Correlation Analysis"
            value={confidence?.analysisDepth?.correlationAnalysis}
          />
          <div className="pt-2 text-xs text-[var(--foreground-muted)]">
            Created {formatDate(dna.createdAt)}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 1 — Core Identity ───────────────────────────── */}
      {coreIdentity && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Core Identity</CardTitle>
            <CardDescription>Your primary voice signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {coreIdentity.primaryVoice && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Primary Voice
                </p>
                <FieldRow label="Tone" value={coreIdentity.primaryVoice.tone} />
                <FieldRow
                  label="Communication Style"
                  value={coreIdentity.primaryVoice.communicationStyle}
                />
                <div className="py-2 border-b border-white/5">
                  <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Personality traits</p>
                  <TagList items={coreIdentity.primaryVoice.personality} />
                </div>
              </div>
            )}

            {coreIdentity.uniqueSignature && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Unique Signature
                </p>
                {coreIdentity.uniqueSignature.visualSignature && (
                  <FieldRow
                    label="Visual Signature"
                    value={coreIdentity.uniqueSignature.visualSignature}
                  />
                )}
                {!!coreIdentity.uniqueSignature.catchphrases?.length && (
                  <div className="py-2 border-b border-white/5">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Catchphrases</p>
                    <TagList items={coreIdentity.uniqueSignature.catchphrases} />
                  </div>
                )}
                {!!coreIdentity.uniqueSignature.writingQuirks?.length && (
                  <div className="py-2">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Writing quirks</p>
                    <TagList items={coreIdentity.uniqueSignature.writingQuirks} />
                  </div>
                )}
              </div>
            )}

            {!!coreIdentity.contentPillars?.length && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Content Pillars
                </p>
                <div className="space-y-3">
                  {coreIdentity.contentPillars.map((pillar, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{pillar.pillar}</span>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {pct(pillar.weight)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                          style={{ width: `${Math.round(pillar.weight * 100)}%` }}
                        />
                      </div>
                      <TagList items={pillar.keywords} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Section 2 — Linguistic Patterns ────────────────────── */}
      {writingDNA && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Linguistic Patterns</CardTitle>
            <CardDescription>How you write and structure your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {writingDNA.styleProfile && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Style Profile
                </p>
                <FieldRow label="Sentence Rhythm" value={writingDNA.styleProfile.sentenceRhythm} />
                <FieldRow label="Vocabulary Level" value={writingDNA.styleProfile.vocabularyLevel} />
                <FieldRow
                  label="Punctuation Style"
                  value={writingDNA.styleProfile.punctuationPersonality}
                />
                {!!writingDNA.styleProfile.emotionalRange?.length && (
                  <div className="py-2">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Emotional range</p>
                    <TagList items={writingDNA.styleProfile.emotionalRange} />
                  </div>
                )}
              </div>
            )}

            {writingDNA.contentStructure && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Content Structure
                </p>
                <FieldRow label="Opening Style" value={writingDNA.contentStructure.openingStyle} />
                <FieldRow label="Body Structure" value={writingDNA.contentStructure.bodyStructure} />
                <FieldRow label="Closing Style" value={writingDNA.contentStructure.closingStyle} />
                <FieldRow label="CTA Pattern" value={writingDNA.contentStructure.ctaPattern} />
              </div>
            )}

            {writingDNA.linguisticPatterns && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Linguistic Fingerprint
                </p>
                <FieldRow
                  label="Metaphor Style"
                  value={writingDNA.linguisticPatterns.metaphorStyle}
                />
                <FieldRow
                  label="Storytelling Approach"
                  value={writingDNA.linguisticPatterns.storytellingApproach}
                />
                {!!writingDNA.linguisticPatterns.favoriteWords?.length && (
                  <div className="py-2 border-b border-white/5">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Favourite words</p>
                    <TagList items={writingDNA.linguisticPatterns.favoriteWords} />
                  </div>
                )}
                {!!writingDNA.linguisticPatterns.phraseTemplates?.length && (
                  <div className="py-2">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">
                      Recurring phrase templates
                    </p>
                    <div className="space-y-1.5">
                      {writingDNA.linguisticPatterns.phraseTemplates.map((t, i) => (
                        <p
                          key={i}
                          className="text-xs text-[var(--foreground-muted)] italic border-l-2 border-white/10 pl-3"
                        >
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Section 3 — Content Themes & Strategy ──────────────── */}
      {strategyDNA && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Content Themes &amp; Strategy</CardTitle>
            <CardDescription>What works best for your audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {strategyDNA.engagementDrivers && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Engagement Drivers
                </p>
                {!!strategyDNA.engagementDrivers.topTriggers?.length && (
                  <div className="py-2 border-b border-white/5">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Top triggers</p>
                    <TagList items={strategyDNA.engagementDrivers.topTriggers} />
                  </div>
                )}
                {!!strategyDNA.engagementDrivers.audiencePreferences?.length && (
                  <div className="py-2 border-b border-white/5">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">
                      Audience preferences
                    </p>
                    <TagList items={strategyDNA.engagementDrivers.audiencePreferences} />
                  </div>
                )}
                {!!strategyDNA.engagementDrivers.contentGaps?.length && (
                  <div className="py-2">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Content gaps</p>
                    <TagList items={strategyDNA.engagementDrivers.contentGaps} />
                  </div>
                )}
              </div>
            )}

            {strategyDNA.hashtagFormula && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Hashtag Formula
                </p>
                <FieldRow
                  label="Optimal Count"
                  value={strategyDNA.hashtagFormula.optimalCount}
                />
                {!!strategyDNA.hashtagFormula.categoryMix?.length && (
                  <div className="py-2">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Category mix</p>
                    <TagList items={strategyDNA.hashtagFormula.categoryMix} />
                  </div>
                )}
              </div>
            )}

            {!!strategyDNA.contentFormula?.winningCombinations?.length && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">
                  Winning Combinations
                </p>
                <div className="space-y-3">
                  {strategyDNA.contentFormula.winningCombinations.slice(0, 3).map((combo, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{combo.visualStyle}</span>
                        <span className="text-xs text-[var(--primary)] font-semibold">
                          {pct(combo.expectedPerformance)} expected
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {combo.captionApproach}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">🕐 {combo.timing}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Section 4 — Engagement Insights ────────────────────── */}
      {behavioralDNA?.postingBehavior && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Engagement Insights</CardTitle>
            <CardDescription>Your posting behaviour and timing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow
              label="Posting Frequency"
              value={behavioralDNA.postingBehavior.frequency}
            />
            {behavioralDNA.postingBehavior.consistency !== undefined && (
              <ConfidenceBar
                label="Consistency Score"
                value={behavioralDNA.postingBehavior.consistency}
              />
            )}
            {!!behavioralDNA.postingBehavior.optimalTiming?.length && (
              <div className="pt-2">
                <p className="text-xs text-[var(--foreground-muted)] mb-2">
                  Best times to post
                </p>
                <TagList items={behavioralDNA.postingBehavior.optimalTiming} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Section 5 — Caption Templates ──────────────────────── */}
      {!!generationTemplates?.captionTemplates?.length && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Caption Templates</CardTitle>
            <CardDescription>
              Reusable patterns trained on your style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generationTemplates.captionTemplates.slice(0, 4).map((tpl, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">
                    {tpl.context}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] font-mono leading-relaxed">
                  {tpl.template}
                </p>
                {tpl.exampleOutput && (
                  <p className="text-xs border-l-2 border-white/10 pl-3 text-[var(--foreground-muted)] italic">
                    {tpl.exampleOutput}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Section 6 — Hashtag Sets ────────────────────────────── */}
      {!!generationTemplates?.hashtagSets?.length && (
        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Hashtag Sets</CardTitle>
            <CardDescription>Curated hashtag groups for different contexts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generationTemplates.hashtagSets.map((set, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{set.name}</span>
                  <span className="text-xs text-[var(--foreground-muted)]">{set.useCase}</span>
                </div>
                <TagList items={set.tags} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
        <Button onClick={() => router.push("/captions")}>
          Generate Captions with this DNA
        </Button>
      </div>
    </div>
  );
}
