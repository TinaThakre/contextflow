"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Play,
  PenTool, 
  Share2, 
  TrendingUp,
  Bot,
  Clock,
  Award
} from "lucide-react";
import Link from "next/link";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

// Features data
const features = [
  {
    icon: PenTool,
    title: "Voice DNA Analysis",
    description:
      "We analyze your writing style from your existing posts to create content that sounds authentically like you.",
  },
  {
    icon: Share2,
    title: "Platform Optimization",
    description:
      "Every piece of content is optimized for the specific platform - Instagram, LinkedIn, Twitter, or Threads.",
  },
  {
    icon: Bot,
    title: "Multi-AI Provider",
    description:
      "Powered by Google Vertex AI with Claude fallback ensures 99.9% uptime for your content generation.",
  },
  {
    icon: TrendingUp,
    title: "Engagement Prediction",
    description:
      "AI-powered engagement scoring helps you choose the best content before publishing.",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    description:
      "Optimal posting times suggested based on your audience activity patterns.",
  },
  {
    icon: Award,
    title: "Trend Integration",
    description:
      "Real-time trend intelligence from Google, Reddit, and News to keep your content timely.",
  },
];

// Platforms data
const platforms = [
  { name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-500" },
  { name: "LinkedIn", icon: Linkedin, color: "from-blue-500 to-cyan-500" },
  { name: "Twitter", icon: Twitter, color: "from-sky-400 to-blue-500" },
  { name: "Threads", icon: MessageCircle, color: "from-gray-600 to-gray-800" },
];

// Testimonials/Stats
const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "1M+", label: "Posts Generated" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              
              <span className="text-xl font-bold text-gradient">
                ContextFlow
              </span>
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              {["Features", "Pricing", "About"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
                >
                  {item}
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-bold rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] transition-all hover-glow"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)] to-[var(--background)] z-0" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)] rounded-full blur-[128px] opacity-20 animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background-tertiary)] border border-[var(--border)] text-sm text-[var(--foreground-muted)]">
                
                AI-Powered Content Creation
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Content that sounds{" "}
              <span className="text-gradient">exactly like you</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10"
            >
              Generate authentic, personalized content for Instagram, LinkedIn,
              Twitter, and Threads. Powered by our revolutionary Voice DNA
              technology.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
             <Link
            href="/signup"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] !text-white font-black text-lg hover:scale-105 transition-transform hover-glow drop-shadow-md shadow-black/20"
          >
            <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.2)]">Start Creating Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform !text-white" />
          </Link>
              <button className="flex items-center gap-2 px-8 py-4 rounded-full border border-[var(--border)] text-[var(--foreground)] font-bold text-lg hover:bg-[var(--background-tertiary)] transition-colors">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Platform Icons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-20 flex items-center justify-center gap-6"
          >
            <span className="text-[var(--foreground-subtle)] text-sm">
              Supported Platforms
            </span>
            <div className="flex items-center gap-4">
              {platforms.map((platform, i) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)] transition-colors">
                    <platform.icon className="w-6 h-6 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      

      {/* How It Works */}
      <section id="features" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
      <span className="text-[var(--secondary)] text-sm font-medium uppercase tracking-wider">
        Features
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
        Everything you need to{" "}
        <span className="text-gradient">dominate social media</span>
      </h2>
      <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
        Powerful AI tools designed to make your content stand out while
        maintaining your unique voice.
      </p>
    </motion.div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className="group p-6 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all hover-lift"
        >
          {/* Removed the gradient div wrapper entirely */}
          <div className="mb-4">
            <feature.icon className="w-8 h-8 text-[var(--primary)] group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
</section>
      {/* Pricing CTA */}
      <section id="pricing" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-br from-[var(--background-secondary)] via-[var(--background-tertiary)] to-[var(--background-secondary)] border border-[var(--border)] p-8 lg:p-16 text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[var(--primary)] to-transparent opacity-20" />
            
            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block px-4 py-2 rounded-full bg-[var(--primary)]/20 text-[var(--primary-light)] text-sm font-bold mb-6"
              >
                Start Free Today
              </motion.span>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Ready to transform your{" "}
                <span className="text-gradient">content strategy?</span>
              </h2>
              
              <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10">
                Join thousands of creators who are saving hours every week while
                producing better content. No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] !text-white font-black text-lg hover:scale-105 transition-transform hover-glow drop-shadow-md shadow-black/20"
              >
                <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.2)]">Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform !text-white" />
              </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--foreground-muted)]">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  10 generations free
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">ContextFlow AI</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-[var(--foreground-muted)]">
              <a href="#" className="hover:text-[var(--foreground)] transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-[var(--foreground)] transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-[var(--foreground)] transition-colors">
                Contact
              </a>
            </div>

            <div className="text-sm text-[var(--foreground-subtle)]">
              © 2024 ContextFlow AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}