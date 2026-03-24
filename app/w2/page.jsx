'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, DollarSign, Calendar, Info, Download } from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

export default function W2Page() {
  const { data: session, status } = useSession();
  const [w2s, setW2s] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/'); return; }

    fetch('/api/w2')
      .then(res => res.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setW2s(data.w2s || []); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load W-2 data'); setLoading(false); });
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading W-2 forms...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold">{countyName.charAt(0)}</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">{countyName}</h1>
                <p className="text-xs text-gray-500">Employee Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">W-2 Forms</h2>
          <p className="text-gray-600">Wage and tax statements for your records</p>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Official copies:</span> W-2 figures shown here come
            directly from payroll records. For an official printed copy, contact the Payroll
            department or Human Resources.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-6">
            <FileText size={40} className="text-red-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Unable to Load W-2 Data</h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && w2s.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">No W-2 Forms Found</h4>
            <p className="text-gray-600 text-sm">
              W-2 records are not available in the system yet. Please contact Payroll or HR for assistance.
            </p>
          </div>
        )}

        {/* W-2 cards */}
        <div className="space-y-4">
          {w2s.map((w2) => (
            <div
              key={w2.taxYear}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setExpanded(expanded === w2.taxYear ? null : w2.taxYear)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-lg">{w2.taxYear}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Tax Year {w2.taxYear}</p>
                    <p className="text-sm text-gray-500">W-2 Wage and Tax Statement</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 mb-0.5">Wages (Box 1)</p>
                    <p className="text-xl font-bold text-gray-900">{fmt(w2.box1)}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expanded === w2.taxYear ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === w2.taxYear && (
                <div className="border-t border-gray-200 p-6">
                  {/* Mobile wages summary */}
                  <div className="sm:hidden mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Wages (Box 1)</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(w2.box1)}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Box 1 — Wages, tips, other comp', value: w2.box1, color: 'blue' },
                      { label: 'Box 2 — Federal income tax withheld', value: w2.box2, color: 'red' },
                      { label: 'Box 3 — Social Security wages', value: w2.box3, color: 'purple' },
                      { label: 'Box 4 — Social Security tax withheld', value: w2.box4, color: 'red' },
                      { label: 'Box 5 — Medicare wages and tips', value: w2.box5, color: 'purple' },
                      { label: 'Box 6 — Medicare tax withheld', value: w2.box6, color: 'red' },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign size={16} className={`text-${color}-500 flex-shrink-0`} />
                          <span className="text-sm text-gray-700">{label}</span>
                        </div>
                        <span className="font-bold text-gray-900 ml-2 whitespace-nowrap">{fmt(value)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Note:</span> State wages (Box 16) and state
                      tax withheld (Box 17) are included on your official W-2 from Payroll.
                      Contact HR for a printed copy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help notice */}
        {w2s.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">💡</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Need a Printed Copy?</h4>
                <p className="text-gray-700 text-sm mb-3">
                  Official W-2 copies are issued by the Payroll department each January. If you
                  need a reprint or have questions about your W-2 figures, contact Human Resources.
                </p>
                <button
                  onClick={() => router.push('/contact')}
                  className="inline-flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                >
                  <span>Contact HR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
