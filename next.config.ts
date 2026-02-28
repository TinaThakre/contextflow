const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Use server-side rendering for all pages to avoid static generation issues
  output: 'standalone',
  // Disable static optimization
  trailingSlash: true,
}

export default nextConfig;
