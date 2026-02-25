'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

export default function LoginPage() {
  // step 1 = emp# + SSN
  // step 2 = date of birth (first time only)
  // step 3 = password (returning users)
  const [step, setStep] = useState(1);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [ssn, setSSN] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const router = useRouter();

  // Step 1: Verify employee number + SSN
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: employeeNumber.trim(),
          ssn: ssn.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
        return;
      }

      setEmployeeName(data.name || '');

      if (data.isFirstLogin) {
        // First time - need DOB verification
        setStep(2);
        setLoading(false);
      } else {
        // Returning user - go straight to password
        setStep(3);
        setLoading(false);
      }
    } catch (err) {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Verify Date of Birth (first time only)
  const handleVerifyDOB = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: employeeNumber.trim(),
          ssn: ssn.trim(),
          dob: dob.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Date of birth does not match our records.');
        setLoading(false);
        return;
      }

      // DOB verified - sign in and go to change password
      const result = await signIn('credentials', {
        redirect: false,
        employeeNumber: employeeNumber.trim(),
        ssn: ssn.trim(),
        password: ''
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push('/change-password');

    } catch (err) {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  // Step 3: Password login (returning users)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        employeeNumber: employeeNumber.trim(),
        ssn: ssn.trim(),
        password: password
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
    setPassword('');
    setDob('');
  };

  // Auto format DOB input as MM/DD/YYYY
  const handleDobChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // numbers only
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10);
    setDob(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white p-10 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-bold text-black">{countyName.charAt(0)}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{countyName}</h2>
          <p className="text-red-100 text-sm">Employee Self-Service Portal</p>
        </div>

        <div className="p-10">

          {/* STEP 1 - Employee Number + SSN */}
          {step === 1 && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Sign In</h3>
              <p className="text-gray-600 text-center mb-8 text-sm">
                Access your employee information
              </p>

              <form onSubmit={handleVerifyIdentity} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 - Date of Birth (First Time Only) */}
          {step === 2 && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Verify Your Identity
              </h3>

              {employeeName && (
                <p className="text-center text-orange-600 font-semibold mb-2">
                  {employeeName}
                </p>
              )}

              <p className="text-gray-600 text-center mb-8 text-sm">
                For security, please confirm your date of birth to set up your account
              </p>

              <form onSubmit={handleVerifyDOB} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || dob.length < 10}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* STEP 3 - Password (Returning Users) */}
          {step === 3 && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Welcome Back
              </h3>

              {employeeName && (
                <p className="text-center text-orange-600 font-semibold mb-6">
                  {employeeName}
                </p>
              )}

              <p className="text-gray-600 text-center mb-8 text-sm">
                Enter your password to continue
              </p>

              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all pr-12"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
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
                  {loading ? 'Signing In...' : 'Sign In to Portal'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Need assistance?</p>
            <p className="text-sm font-bold text-gray-900">Contact Human Resources</p>
            <p className="text-xs text-gray-500 mt-1">
              hr@{countyName.toLowerCase().replace(' ', '')}.gov
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}