"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const platforms = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "from-purple-500 to-pink-500" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", color: "from-black to-gray-800" },
  { id: "threads", name: "Threads", icon: "💬", color: "from-gray-600 to-gray-800" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformUsernames, setPlatformUsernames] = useState<Record<string, string>>({});
  const [postLimit, setPostLimit] = useState(50);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedPosts, setScrapedPosts] = useState(0);
  const [scrapingProgress, setScrapingProgress] = useState<Record<string, any>>({});
  const [showScrapingModal, setShowScrapingModal] = useState(false);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleUsernameChange = (platformId: string, username: string) => {
    setPlatformUsernames((prev) => ({
      ...prev,
      [platformId]: username,
    }));
  };

  const handleConnect = async () => {
    if (selectedPlatforms.length === 0) return;
    
    // Validate that all selected platforms have usernames
    const missingUsernames = selectedPlatforms.filter(
      (platform) => !platformUsernames[platform]?.trim()
    );
    
    if (missingUsernames.length > 0) {
      setError("Please enter usernames for all selected platforms");
      return;
    }

    setIsConnecting(true);
    setShowScrapingModal(true);
    setError(null);
    setScrapingProgress({});

    try {
      // Get Firebase auth token
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("Please log in to continue");
      }

      const idToken = await auth.currentUser.getIdToken();

      // Prepare platform data
      const platformsData = selectedPlatforms.map((platform) => ({
        platform: platform as 'instagram' | 'linkedin' | 'twitter',
        username: platformUsernames[platform].trim(),
      }));

      // Initialize progress for each platform
      platformsData.forEach(({ platform }) => {
        setScrapingProgress((prev) => ({
          ...prev,
          [platform]: { status: 'fetching', posts: 0 },
        }));
      });

      // Call scrape API
      const response = await fetch("/api/social/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          platforms: platformsData,
          limit: postLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scrape social media");
      }

      const data = await response.json();
      
      // Update progress with results
      Object.entries(data.results || {}).forEach(([platform, result]: [string, any]) => {
        setScrapingProgress((prev) => ({
          ...prev,
          [platform]: {
            status: result.success ? 'completed' : 'failed',
            posts: result.totalPosts || 0,
            error: result.error,
          },
        }));
      });

      setScrapedPosts(data.totalPosts || 0);
      
      // Wait a bit to show the results
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setIsConnecting(false);
      setShowScrapingModal(false);
      setStep(2);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect platforms");
      setIsConnecting(false);
      setShowScrapingModal(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate Voice DNA analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                step >= s
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 scale-110"
                  : "bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Connect Platforms */}
        {step === 1 && (
          <Card className="p-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Connect Your Accounts
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Select platforms and enter your usernames to analyze your Voice DNA
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Number of posts to import per platform
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={postLimit}
                  onChange={(e) => setPostLimit(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-purple-400">{postLimit}</span>
                  <p className="text-xs text-gray-500">posts</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                More posts = better Voice DNA accuracy (recommended: 50+)
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {platforms.slice(0, 3).map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedPlatforms.includes(platform.id)
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-600"
                      }`}
                    >
                      {selectedPlatforms.includes(platform.id) && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </button>
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="text-white font-medium">{platform.name}</span>
                  </div>
                  
                  {selectedPlatforms.includes(platform.id) && (
                    <div className="mt-3">
                      <Input
                        type="text"
                        placeholder={`Enter your ${platform.name} username`}
                        value={platformUsernames[platform.id] || ""}
                        onChange={(e) => handleUsernameChange(platform.id, e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleConnect}
              disabled={selectedPlatforms.length === 0 || isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scraping your content...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </Card>
        )}

        {/* Scraping Progress Modal */}
        {showScrapingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <Card className="p-8 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-ping opacity-20" />
                  <div className="relative w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Fetching Your Content
                </h2>
                <p className="text-gray-400 text-sm">
                  Analyzing your posts from selected platforms
                </p>
              </div>

              <div className="space-y-4">
                {selectedPlatforms.map((platformId) => {
                  const platform = platforms.find((p) => p.id === platformId);
                  const progress = scrapingProgress[platformId];
                  
                  return (
                    <div
                      key={platformId}
                      className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{platform?.icon}</span>
                          <div>
                            <p className="text-white font-medium">{platform?.name}</p>
                            <p className="text-xs text-gray-400">@{platformUsernames[platformId]}</p>
                          </div>
                        </div>
                        {progress?.status === 'completed' && (
                          <span className="text-green-400 text-xl">✓</span>
                        )}
                        {progress?.status === 'failed' && (
                          <span className="text-red-400 text-xl">✗</span>
                        )}
                        {progress?.status === 'fetching' && (
                          <span className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        )}
                      </div>

                      {progress?.status === 'completed' && (
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between text-gray-300">
                            <span>Posts fetched:</span>
                            <span className="font-semibold text-purple-400">{progress.posts}</span>
                          </div>
                          <div className="flex justify-between text-gray-400 text-xs">
                            <span>Data collected:</span>
                            <span>Text, timestamps, engagement</span>
                          </div>
                        </div>
                      )}

                      {progress?.status === 'failed' && (
                        <p className="mt-2 text-xs text-red-400">{progress.error}</p>
                      )}

                      {progress?.status === 'fetching' && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Fetching posts...</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-300 text-center">
                  <span className="font-semibold">What we collect:</span> Post text, timestamps, likes, comments, and shares for Voice DNA analysis
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Analyzing Voice DNA */}
        {step === 2 && (
          <Card className="p-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-ping opacity-20" />
                <div className="relative w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🧬</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Analyzing Your Voice DNA
            </h1>
            <p className="text-gray-400 mb-6">
              We're analyzing your content to understand your unique writing style
            </p>

            {scrapedPosts > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center">
                ✓ Successfully scraped {scrapedPosts} posts from your accounts
              </div>
            )}

            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
                </div>
                <p className="text-gray-500 text-sm">Extracting style patterns from {scrapedPosts} posts...</p>
              </div>
            ) : (
              <Button onClick={handleAnalyze} className="w-full">
                Start Analysis
              </Button>
            )}
          </Card>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card className="p-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              You're All Set!
            </h1>
            <p className="text-gray-400 mb-8">
              Your Voice DNA has been analyzed. You can now generate content that sounds just like you.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Voice DNA: 92% confidence</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{selectedPlatforms.length} platforms connected</span>
              </div>
            </div>

            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
