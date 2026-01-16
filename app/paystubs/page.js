'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Calendar, DollarSign, FileText, Search, Filter } from 'lucide-react';

export default function PayStubsPage() {
  const [employee, setEmployee] = useState(null);
  const [payStubs, setPayStubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Check if logged in
    const stored = sessionStorage.getItem('employee');
    if (!stored) {
      router.push('/');
      return;
    }

    const emp = JSON.parse(stored);
    setEmployee(emp);

    // Fetch pay stubs using the hidden employee ID
    fetch(`/api/paystubs/${emp.hiddenId}`)
      .then(res => res.json())
      .then(data => {
        setPayStubs(data.payStubs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching pay stubs:', err);
        setLoading(false);
      });
  }, [router]);

  // Get unique years from pay stubs for filtering
  const availableYears = ['all', ...new Set(
    payStubs.map(stub => new Date().getFullYear()) // Would extract from actual dates when available
  )];

  // Filter pay stubs based on search and year
  const filteredPayStubs = payStubs.filter(stub => {
    const matchesSearch = stub.checkNumber?.toString().includes(searchTerm);
    const matchesYear = selectedYear === 'all' || true; // Would filter by actual date when available
    return matchesSearch && matchesYear;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading pay stubs...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading employee data</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
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
                <span className="text-white font-bold">L</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Luna County</h1>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
                <input
                  type="text"
                  placeholder="Search by check number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-black"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none bg-white cursor-pointer text-gray-500"
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
                  : 'No payment records available at this time'}
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
                            <span>Date not available</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign size={14} />
                            <span className="font-semibold">Net: {stub.netPay}</span>
                          </div>
                          {stub.bank && (
                            <div className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                              <span className="text-xs font-bold">Bank: {stub.bank}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Action */}
                    <button
                      onClick={() => alert('Download functionality will be implemented with real pay stub data')}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                    >
                      <Download size={18} />
                      <span>Download PDF</span>
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