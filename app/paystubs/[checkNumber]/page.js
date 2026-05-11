'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

export default function PaystubDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const checkNumber = params.checkNumber;

  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';
  const hasPrinted = useRef(false);

  const [paystub, setPaystub] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.employeeNumber) return;
      try {
        const [empRes, stubRes] = await Promise.all([
          fetch(`/api/employee/${session.user.employeeNumber}`),
          fetch(`/api/paystubs/${session.user.employeeNumber}`)
        ]);
        const empData = await empRes.json();
        const stubData = await stubRes.json();
        setEmployee(empData);

        const found = stubData.payStubs?.find(
          s => s.checkNumber?.toString() === checkNumber
        );
        setPaystub(found || null);

        if (found?.runDate) {
          const detailRes = await fetch(`/api/paystub-detail?run=${found.runDate}`);
          const detailData = await detailRes.json();
          setDetail(detailData);
        }
      } catch (error) {
        console.error('Error fetching paystub:', error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchData();
  }, [session, checkNumber]);

  // Auto-print when navigated from list with ?print=true
  useEffect(() => {
    if (!loading && paystub && autoPrint && !hasPrinted.current) {
      hasPrinted.current = true;
      window.print();
    }
  }, [loading, paystub, autoPrint]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pay stub...</p>
        </div>
      </div>
    );
  }

  if (!paystub) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pay Stub Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to find pay stub #{checkNumber}</p>
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
      {/* Action bar — hidden on print */}
      <div className="container mx-auto px-4 mb-6 no-print">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/paystubs')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Pay Stubs</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-md"
          >
            <Printer size={20} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Pay stub — print friendly */}
      <div className="container mx-auto px-4">
        <div className="print-paystub bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">

          {/* Header */}
          <div className="border-b-2 border-gray-300 pb-6 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{countyName}</h1>
              <p className="text-gray-600">Employee Earnings Statement</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Check Number</p>
              <p className="text-2xl font-bold text-gray-900">#{paystub.checkNumber}</p>
            </div>
          </div>

          {/* Employee & Pay Period */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Employee Information</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-900">{employee?.name?.first} {employee?.name?.middle} {employee?.name?.last}</span></p>
                <p><span className="text-gray-500">Employee #:</span> <span className="font-semibold text-gray-900">{employee?.employeeNumber}</span></p>
                {paystub.department && <p><span className="text-gray-500">Department:</span> <span className="font-semibold text-gray-900">{paystub.department}</span></p>}
                {paystub.position && <p><span className="text-gray-500">Position:</span> <span className="font-semibold text-gray-900">{paystub.position}</span></p>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pay Period</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-gray-500">Pay Date:</span> <span className="font-semibold text-gray-900">{paystub.payDate || 'N/A'}</span></p>
                {paystub.periodStart && paystub.periodEnd && (
                  <p><span className="text-gray-500">Period:</span> <span className="font-semibold text-gray-900">{paystub.periodStart} – {paystub.periodEnd}</span></p>
                )}
                <p><span className="text-gray-500">Payment Method:</span> <span className="font-semibold text-gray-900">{paystub.bank === 'DD' ? 'Direct Deposit' : `Bank ${paystub.bank || 'N/A'}`}</span></p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Earnings</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-bold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Hours</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {detail?.earnings?.length > 0 ? (
                  detail.earnings.map((e, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-900">{e.description}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{e.hours > 0 ? e.hours : '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmt(e.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-900">Gross Pay</td>
                    <td className="px-4 py-2 text-right text-gray-600">—</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{paystub.grossPay}</td>
                  </tr>
                )}
                <tr className="bg-blue-50 border-t-2 border-blue-300">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan={2}>Total Gross</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{paystub.grossPay}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Deductions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-bold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Employee</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Employer</th>
                </tr>
              </thead>
              <tbody>
                {detail?.deductions?.length > 0 ? (
                  detail.deductions.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-900">{d.description}</td>
                      <td className="px-4 py-2 text-right text-red-600">{d.employeeAmount > 0 ? fmt(d.employeeAmount) : '—'}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{d.employerAmount > 0 ? fmt(d.employerAmount) : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-900">Total Deductions</td>
                    <td className="px-4 py-2 text-right text-red-600">{paystub.deductions}</td>
                    <td className="px-4 py-2 text-right text-gray-500">—</td>
                  </tr>
                )}
                <tr className="bg-red-50 border-t-2 border-red-300">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan={2}>Total Deductions</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{paystub.deductions}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 flex justify-between items-center mb-8">
            <p className="text-xl font-bold text-gray-900">Net Pay</p>
            <p className="text-3xl font-bold text-green-600">{paystub.netPay}</p>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
            <p>This is an official pay stub from {countyName}.</p>
            <p className="mt-1">Printed on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
