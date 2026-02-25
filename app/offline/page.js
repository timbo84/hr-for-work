'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M8.111 8.111A5.97 5.97 0 006 12c0 3.314 2.686 6 6 6a5.97 5.97 0 003.889-1.889M15.657 5.757A8.965 8.965 0 0112 5c-4.97 0-9 4.03-9 9 0 1.33.29 2.592.806 3.727M20.194 15.194A8.965 8.965 0 0021 12c0-4.97-4.03-9-9-9a8.965 8.965 0 00-3.194.806"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">You're offline</h1>
        <p className="text-gray-500 mb-6">
          Please check your internet connection and try again to access the HR Portal.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
