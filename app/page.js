'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [ssn, setSSN] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Submitting:', { employeeNumber, ssn, parsedEmp: parseInt(employeeNumber) });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber,
          ssn
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store employee info in sessionStorage
        sessionStorage.setItem('employee', JSON.stringify(data.employee));
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white p-10 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-bold text-black">L</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Luna County</h2>
          <p className="text-red-100 text-sm">Employee Self-Service Portal</p>
        </div>
        
        <div className="p-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Sign In</h3>
          <p className="text-gray-600 text-center mb-8 text-sm">Access your employee information</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Employee Number
              </label>
              <input
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-500"
                placeholder="Enter employee number"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last 4 of SSN
              </label>
              <input
                type="password"
                value={ssn}
                onChange={(e) => setSSN(e.target.value)}
                maxLength="4"
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-500"
                placeholder="Last 4 digits"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Need assistance?</p>
            <p className="text-sm font-bold text-gray-900">Contact Human Resources</p>
            <p className="text-xs text-gray-500 mt-1">hr@leacounty.gov</p>
          </div>
        </div>
      </div>
    </div>
  );
}