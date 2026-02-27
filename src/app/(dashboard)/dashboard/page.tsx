"use client";

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

// Quick stats
const stats = [
  {
    title: "Total Generations",
    value: "127",
    change: "+23%",
    trend: "up",
    icon: Wand2,
  },
  {
    title: "Published Posts",
    value: "89",
    change: "+12%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Avg Engagement",
    value: "4.2%",
    change: "+0.8%",
    trend: "up",
    icon: BarChart3,
  },
  {
    title: "Scheduled",
    value: "12",
    change: "3 today",
    trend: "neutral",
    icon: Calendar,
  },
];

// Recent activity
const recentContent = [
  {
    platform: "instagram",
    content: "Excited to announce our new product launch! 🚀 #innovation #startup",
    status: "published",
    engagement: 234,
    time: "2 hours ago",
  },
  {
    platform: "linkedin",
    content: "5 lessons learned from building a successful SaaS company...",
    status: "scheduled",
    engagement: 0,
    time: "Tomorrow at 10:00 AM",
  },
  {
    platform: "twitter",
    content: "Hot take: AI won't replace writers, it will amplify them.",
    status: "draft",
    engagement: 0,
    time: "Not saved yet",
  },
];

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

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => (
          <motion.div key={stat.title} variants={fadeInUp}>
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
          </motion.div>
        ))}
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
                {recentContent.map((item, i) => {
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
                          <span className="text-xs text-[var(--foreground-subtle)]">
                            {item.time}
                          </span>
                          {item.engagement > 0 && (
                            <span className="text-xs text-[var(--foreground-muted)]">
                              {item.engagement} engagements
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="w-full h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                    style={{ width: "92%" }}
                  />
                </div>
                <Link
                  href="/dashboard/voice-dna"
                  className="block text-center text-sm text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
