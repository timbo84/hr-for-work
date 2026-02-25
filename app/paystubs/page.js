'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Calendar, DollarSign, FileText, Search, Filter, Printer } from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

export default function PayStubsPage() {
  const { data: session, status } = useSession();
  const [payStubs, setPayStubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // If no session, redirect to login
    if (!session) {
      router.push('/');
      return;
    }

    // Fetch pay stubs using session data
    fetch(`/api/paystubs/${session.user.employeeNumber}`)
      .then(res => res.json())
      .then(data => {
        setPayStubs(data.payStubs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching pay stubs:', err);
        setLoading(false);
      });
  }, [session, status, router]);

  // Get unique years from pay stubs for filtering
  const availableYears = ['all', ...new Set(
    payStubs.map(stub => new Date().getFullYear())
  )];

  // Filter pay stubs based on search and year
  const filteredPayStubs = payStubs.filter(stub => {
    const matchesSearch = !searchTerm || stub.checkNumber?.toString().includes(searchTerm);
    const matchesYear = selectedYear === 'all' || true;
    return matchesSearch && matchesYear;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading pay stubs...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pay Stubs</h2>
          <p className="text-gray-600">View and download your payment history</p>
        </div>

        {/* Info Banner - Historical Records Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Recent Pay History:</span> Showing your most recent 100 pay stubs (approximately 4 years).
                For records older than four years, please contact Human Resources at{' '}
                <a href="mailto:hr@lunacounty.gov" className="underline hover:text-blue-800">
                  hr@lunacounty.gov
                </a> or call the HR office.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <FileText size={32} className="text-white opacity-80" />
            </div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Pay Stubs</p>
            <p className="text-3xl font-bold">{payStubs.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Calendar size={32} className="text-white opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Latest Payment</p>
            <p className="text-3xl font-bold">
              {payStubs.length > 0 ? payStubs[0].netPay : 'N/A'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={32} className="text-white opacity-80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Current Year</p>
            <p className="text-3xl font-bold">{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by check number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Years</option>
                  {availableYears.filter(y => y !== 'all').map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Stubs List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredPayStubs.length} {filteredPayStubs.length === 1 ? 'record' : 'records'} found
            </p>
          </div>

          {filteredPayStubs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-gray-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Pay Stubs Found</h4>
              <p className="text-gray-600">
                {searchTerm || selectedYear !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Pay stub data is not yet available. Please contact HR for assistance.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPayStubs.map((stub, index) => (
                <div
                  key={index}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left Side - Info */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <FileText size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          Check #{stub.checkNumber}
                        </h4>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Paid: {stub.payDate || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Period: {stub.periodStart} - {stub.periodEnd}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign size={14} />
                            <span className="font-semibold">Net: {stub.netPay}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Gross: {stub.grossPay}</span>
                          </div>
                          {stub.bank && (
                            <div className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                              <span className="text-xs font-bold">{stub.bank === 'DD' ? 'Direct Deposit' : `Bank: ${stub.bank}`}</span>
                            </div>
                          )}
                          {stub.department && (
                            <div className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                              <span className="text-xs font-bold">Dept: {stub.department}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Action */}
                    <button
                      onClick={() => router.push(`/paystubs/${stub.checkNumber}`)}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                    >
                      <Printer size={18} />
                      <span>View & Print</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Notice */}
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">💡</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">Need Help?</h4>
              <p className="text-gray-700 mb-3">
                If you have questions about your pay stubs or notice any discrepancies, please contact the Payroll department or Human Resources.
              </p>
              <button
                onClick={() => router.push('/contact')}
                className="inline-flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                <span>Contact HR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}