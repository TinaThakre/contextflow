"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  TrendingUp,
  Clock,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  ArrowUpRight,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Link from "next/link";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Quick stats - will be replaced with real data
const getStatsData = (realStats: any) => [
  {
    title: "Total Posts Scraped",
    value: realStats.totalPosts.toString(),
    change: realStats.totalPosts > 0 ? "Active" : "No data",
    trend: realStats.totalPosts > 0 ? "up" : "neutral",
    icon: Wand2,
  },
  {
    title: "Connected Platforms",
    value: realStats.connectedPlatforms.toString(),
    change: realStats.connectedPlatforms > 0 ? "Connected" : "None",
    trend: realStats.connectedPlatforms > 0 ? "up" : "neutral",
    icon: TrendingUp,
  },
  {
    title: "Voice DNA Confidence",
    value: realStats.voiceDnaConfidence > 0 ? `${realStats.voiceDnaConfidence}%` : "N/A",
    change: realStats.onboardingCompleted ? "Ready" : "Pending",
    trend: realStats.onboardingCompleted ? "up" : "neutral",
    icon: BarChart3,
  },
  {
    title: "Status",
    value: realStats.onboardingCompleted ? "Active" : "Setup",
    change: realStats.onboardingCompleted ? "Complete" : "In Progress",
    trend: realStats.onboardingCompleted ? "up" : "neutral",
    icon: Calendar,
  },
];

// Recent activity - removed, will use real data from API
// const recentContent = [...];

// Platform icons mapping
const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  threads: MessageCircle,
};

const platformColors: Record<string, string> = {
  instagram: "from-pink-500 to-purple-500",
  linkedin: "from-blue-500 to-cyan-500",
  twitter: "from-sky-400 to-blue-500",
  threads: "from-gray-600 to-gray-800",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    connectedPlatforms: 0,
    voiceDnaConfidence: 0,
    onboardingCompleted: false,
  });
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        if (!auth?.currentUser) {
          console.log('No user logged in');
          setError('Please log in to view dashboard');
          setIsLoading(false);
          return;
        }

        const idToken = await auth.currentUser.getIdToken();

        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard data:', data);
          setStats(data.stats);
          setRecentContent(data.recentContent || []);
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
          setError(errorData.error || 'Failed to load dashboard data');
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back!</h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Here's what's happening with your content
          </p>
        </div>
        <Link
          href="/captions"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full 
          bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] 
          text-white font-semibold 
          hover:scale-105 transition-transform hover-glow"
        >
          <Wand2 className="w-5 h-5 text-white" />
          <span className="text-white">Generate</span>
        </Link>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Card hover className="h-full">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 w-10 bg-gray-700 rounded-xl" />
                    <div className="h-8 bg-gray-700 rounded w-20" />
                    <div className="h-4 bg-gray-700 rounded w-32" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          getStatsData(stats).map((stat, i) => {
            const isCalendarStat = stat.title === "Status";
            const StatCard = (
              <Card hover className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stat.trend === "up"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : stat.trend === "down"
                          ? "bg-[var(--error)]/10 text-[var(--error)]"
                          : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            return (
              <motion.div key={stat.title} variants={fadeInUp}>
                {isCalendarStat ? (
                  <Link href="/calendar" className="block h-full">
                    {StatCard}
                  </Link>
                ) : (
                  StatCard
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Content</CardTitle>
                <Link
                  href="/dashboard/history"
                  className="text-sm text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentContent.length > 0 ? (
                  recentContent.map((item, i) => {
                    const PlatformIcon = platformIcons[item.platform];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platformColors[item.platform]} flex items-center justify-center flex-shrink-0`}
                        >
                          <PlatformIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                item.status === "published"
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : item.status === "scheduled"
                                  ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                  : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                              }`}
                            >
                              {item.status}
                            </span>
                            {item.engagement > 0 && (
                              <span className="text-xs text-[var(--foreground-muted)]">
                                ❤️ {item.likes} 💬 {item.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <p>No content yet. Start by connecting your social accounts!</p>
                    <Link
                      href="/voice-dna"
                      className="inline-block mt-4 text-[var(--primary)] hover:underline"
                    >
                      Connect Accounts →
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Trending */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-6"
        >
          {/* Quick Generate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rotate-45 bg-[var(--primary)] rounded-sm" />
                Quick Generate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/captions"
                className="block w-full p-4 rounded-xl bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 border border-[var(--primary)]/30 hover:border-[var(--primary)]/50 transition-colors text-center"
              >
                <Wand2 className="w-6 h-6 mx-auto mb-2 text-[var(--primary-light)]" />
                <p className="font-medium">Create New Content</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  AI-powered generation
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Calendar Quick Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--primary)]" />
                Content Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/calendar"
                className="block w-full p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-colors text-center"
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="font-medium">View Calendar</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Schedule & manage posts
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Voice DNA Status */}
          <Card>
            <CardHeader>
              <CardTitle>Voice DNA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    Status
                  </span>
                  <span className="text-sm font-medium text-[var(--success)]">
                    Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    Confidence
                  </span>
                  <span className="text-sm font-medium">
                    {stats.voiceDnaConfidence > 0 ? `${stats.voiceDnaConfidence}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                    style={{ width: `${stats.voiceDnaConfidence || 0}%` }}
                  />
                </div>
                <Link
                  href="/voice-dna"
                  className="block text-center text-sm text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                >
                  {stats.onboardingCompleted ? 'View Details →' : 'Complete Setup →'}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
