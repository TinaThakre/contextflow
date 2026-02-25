import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ContextFlow AI | AI-Powered Content Creation",
  description:
    "Generate authentic, personalized content that sounds exactly like you. Powered by Voice DNA technology for Instagram, LinkedIn, Twitter, and Threads.",
  keywords: [
    "AI content creation",
    "social media marketing",
    "Voice DNA",
    "content generator",
    "Instagram",
    "LinkedIn",
    "Twitter",
    "Threads",
  ],
  authors: [{ name: "ContextFlow AI" }],
  openGraph: {
    title: "ContextFlow AI | AI-Powered Content Creation",
    description:
      "Generate authentic, personalized content that sounds exactly like you.",
    type: "website",
    locale: "en_US",
    siteName: "ContextFlow AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContextFlow AI",
    description: "AI-powered content that sounds like you",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
