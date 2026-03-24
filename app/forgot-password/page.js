'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = verify identity, 2 = set new password
  const [formData, setFormData] = useState({
    employeeNumber: '',
    ssn: '',
    dob: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Auto-format DOB as MM/DD/YYYY
  const handleDobChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10);
    setFormData({ ...formData, dob: value });
  };

  // Step 1: Verify Identity
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: formData.employeeNumber.trim(),
          ssn: formData.ssn.trim(),
          dob: formData.dob.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed. Please check your information.');
        setLoading(false);
        return;
      }

      // Verification successful — store the one-time reset token
      setEmployeeName(data.name || '');
      setResetToken(data.resetToken || '');
      setStep(2);
      setLoading(false);
    } catch (err) {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (formData.newPassword.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/[A-Z]/.test(formData.newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(formData.newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.newPassword)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: formData.employeeNumber.trim(),
          newPassword: formData.newPassword,
          resetToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      // Success - redirect to login
      alert('Password reset successful! Please login with your new password.');
      router.push('/');
    } catch (err) {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError('');
    } else {
      router.push('/');
    }
  };

  // Password strength checks
  const passwordChecks = {
    length: formData.newPassword.length >= 12,
    uppercase: /[A-Z]/.test(formData.newPassword),
    lowercase: /[a-z]/.test(formData.newPassword),
    number: /[0-9]/.test(formData.newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword),
    match: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const CheckItem = ({ valid, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${valid ? 'text-green-600' : 'text-gray-400'}`}>
      {valid ? '✓' : '○'} <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white p-10 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-bold text-black">
              {countyName.charAt(0)}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
          <p className="text-red-100 text-sm">{countyName} HR Portal</p>
        </div>

        <div className="p-10">

          {/* STEP 1 - Verify Identity */}
          {step === 1 && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Verify Your Identity
              </h3>
              <p className="text-gray-600 text-center mb-8 text-sm">
                Enter your information to reset your password
              </p>

              <form onSubmit={handleVerifyIdentity} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
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
                    value={formData.ssn}
                    onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                    maxLength="4"
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Last 4 digits"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={handleDobChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
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
                  disabled={loading || formData.dob.length < 10}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Verifying...' : 'Verify Identity'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowLeft size={20} />
                    <span>Back to Login</span>
                  </div>
                </button>
              </form>
            </>
          )}

          {/* STEP 2 - Set New Password */}
          {step === 2 && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Create New Password
              </h3>

              {employeeName && (
                <p className="text-center text-orange-600 font-semibold mb-6">
                  {employeeName}
                </p>
              )}

              <p className="text-gray-600 text-center mb-8 text-sm">
                Choose a strong password for your account
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Password Requirements:
                  </p>
                  <CheckItem valid={passwordChecks.length} text="At least 12 characters" />
                  <CheckItem valid={passwordChecks.uppercase} text="One uppercase letter (A-Z)" />
                  <CheckItem valid={passwordChecks.lowercase} text="One lowercase letter (a-z)" />
                  <CheckItem valid={passwordChecks.number} text="One number (0-9)" />
                  <CheckItem valid={passwordChecks.special} text="One special character (!@#$...)" />
                  <CheckItem valid={passwordChecks.match} text="Passwords match" />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !Object.values(passwordChecks).every(Boolean)}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
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

        </div>
      </div>
    </div>
  );
}