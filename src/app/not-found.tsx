'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFoundPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to home page in 3 seconds...
        </p>
      </div>
    </div>
  )
}