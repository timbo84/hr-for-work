'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Printer, ArrowLeft, Download } from 'lucide-react';

export default function PaystubDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const checkNumber = params.checkNumber;

  const [paystub, setPaystub] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.employeeNumber) return;

      try {
        // Fetch employee info
        const empResponse = await fetch(`/api/employee/${session.user.employeeNumber}`);
        const empData = await empResponse.json();
        setEmployee(empData);

        // Fetch paystubs and find the one matching this check number
        const stubResponse = await fetch(`/api/paystubs/${session.user.employeeNumber}`);
        const stubData = await stubResponse.json();

        const foundStub = stubData.payStubs?.find(
          s => s.checkNumber?.toString() === checkNumber
        );

        setPaystub(foundStub || null);
      } catch (error) {
        console.error('Error fetching paystub:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session, checkNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading paystub...</p>
        </div>
      </div>
    );
  }

  if (!paystub) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paystub Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to find paystub #{checkNumber}</p>
          <button
            onClick={() => router.push('/paystubs')}
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700"
          >
            <ArrowLeft size={20} />
            <span>Back to Pay Stubs</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with buttons - hidden on print */}
      <div className="container mx-auto px-4 mb-6 no-print">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/paystubs')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Pay Stubs</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-md"
            >
              <Printer size={20} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Paystub - print-friendly */}
      <div className="container mx-auto px-4">
        <div className="print-paystub bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="border-b-2 border-gray-300 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Luna County
                </h1>
                <p className="text-gray-600">Employee Earnings Statement</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Check Number</p>
                <p className="text-2xl font-bold text-gray-900">#{paystub.checkNumber}</p>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
                Employee Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-semibold text-gray-900">
                    {employee?.name?.first} {employee?.name?.middle} {employee?.name?.last}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Employee #:</span>
                  <p className="font-semibold text-gray-900">{employee?.employeeNumber}</p>
                </div>
                {paystub.department && (
                  <div>
                    <span className="text-sm text-gray-600">Department:</span>
                    <p className="font-semibold text-gray-900">{paystub.department}</p>
                  </div>
                )}
                {paystub.position && (
                  <div>
                    <span className="text-sm text-gray-600">Position:</span>
                    <p className="font-semibold text-gray-900">{paystub.position}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
                Pay Period
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Pay Date:</span>
                  <p className="font-semibold text-gray-900">{paystub.payDate || 'N/A'}</p>
                </div>
                {paystub.periodStart && paystub.periodEnd && (
                  <div>
                    <span className="text-sm text-gray-600">Period:</span>
                    <p className="font-semibold text-gray-900">
                      {paystub.periodStart} - {paystub.periodEnd}
                    </p>
                  </div>
                )}
                {paystub.bank && (
                  <div>
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <p className="font-semibold text-gray-900">
                      {paystub.bank === 'DD' ? 'Direct Deposit' : `Bank ${paystub.bank}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="border-t-2 border-gray-300 pt-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Summary</h3>
            
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 text-gray-900">Gross Pay</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {paystub.grossPay}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 text-gray-900">Deductions</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    -{paystub.deductions}
                  </td>
                </tr>
                <tr className="bg-green-50 border-t-2 border-green-500">
                  <td className="px-4 py-4 text-lg font-bold text-gray-900">
                    Net Pay
                  </td>
                  <td className="px-4 py-4 text-right text-2xl font-bold text-green-600">
                    {paystub.netPay}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 mt-8 text-center text-sm text-gray-500">
            <p>This is an official pay stub from Luna County.</p>
            <p className="mt-2">
              Printed on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}