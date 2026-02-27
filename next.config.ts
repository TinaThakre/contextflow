const nextConfig = {
  // Disable static optimization for pages that use Firebase
  experimental: {
    // This helps with Firebase and other client-side libraries
    optimizePackageImports: ['firebase', '@firebase/auth', '@firebase/firestore'],
  },
  // Don't try to statically generate auth-protected pages
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
