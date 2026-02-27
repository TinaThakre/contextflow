"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  Heart,
  MessageSquare,
  Share2,
  Calendar as CalendarIcon,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Input } from "@/components/ui";

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

interface Post {
  id: string;
  text: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
  platform: string;
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        if (!auth?.currentUser) {
          setError("Please log in to view history");
          setIsLoading(false);
          return;
        }

        const idToken = await auth.currentUser.getIdToken();

        const response = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Extract all posts from scraped data
          const allPosts: Post[] = [];
          
          if (data.scrapedData?.results) {
            Object.entries(data.scrapedData.results).forEach(([platform, result]: [string, any]) => {
              if (result.posts && Array.isArray(result.posts)) {
                result.posts.forEach((post: any) => {
                  allPosts.push({
                    ...post,
                    platform,
                  });
                });
              }
            });
          }

          // Sort by timestamp (newest first)
          allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setPosts(allPosts);
          setFilteredPosts(allPosts);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load history");
        }
      } catch (error: any) {
        console.error("Error fetching history:", error);
        setError(error.message || "Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter posts based on search and platform
  useEffect(() => {
    let filtered = posts;

    // Filter by platform
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((post) => post.platform === selectedPlatform);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((post) =>
        post.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [searchQuery, selectedPlatform, posts]);

  const platforms = ["all", ...Array.from(new Set(posts.map((p) => p.platform)))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Content History</h1>
        <p className="text-[var(--foreground-muted)] mt-1">
          All your scraped posts from connected platforms
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === "all" ? "All Platforms" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
            <span>
              Total: <span className="font-semibold text-[var(--foreground)]">{posts.length}</span> posts
            </span>
            <span>
              Showing: <span className="font-semibold text-[var(--foreground)]">{filteredPosts.length}</span> posts
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const PlatformIcon = platformIcons[post.platform];
            const postDate = new Date(post.timestamp);

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card hover>
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platformColors[post.platform]} flex items-center justify-center flex-shrink-0`}
                      >
                        <PlatformIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">{post.platform}</span>
                          <span className="text-xs text-[var(--foreground-muted)]">•</span>
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <CalendarIcon className="w-3 h-3" />
                            {postDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                          {postDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.text}
                    </p>

                    {/* Engagement */}
                    <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
                      {post.likes !== undefined && post.likes > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes.toLocaleString()}</span>
                        </div>
                      )}
                      {post.comments !== undefined && post.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments.toLocaleString()}</span>
                        </div>
                      )}
                      {post.shares !== undefined && post.shares > 0 && (
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          <span>{post.shares.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-[var(--foreground-muted)]">
                <p className="text-lg font-medium mb-2">No posts found</p>
                <p className="text-sm">
                  {searchQuery || selectedPlatform !== "all"
                    ? "Try adjusting your filters"
                    : "Connect your social accounts to see your content history"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
