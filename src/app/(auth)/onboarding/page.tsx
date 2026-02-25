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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleConnect = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsConnecting(true);

    // Simulate OAuth connection
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setStep(2);
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
              Select the platforms you want to analyze for your Voice DNA
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-purple-500 bg-purple-500/10 scale-105"
                      : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <span className="text-3xl block mb-2">{platform.icon}</span>
                  <span className="text-white font-medium">{platform.name}</span>
                </button>
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
                  Connecting...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </Card>
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
            <p className="text-gray-400 mb-8">
              We're analyzing your content to understand your unique writing style
            </p>

            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
                </div>
                <p className="text-gray-500 text-sm">Extracting style patterns...</p>
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
