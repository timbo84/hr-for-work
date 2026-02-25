'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Check, X, CheckCircle } from 'lucide-react';
import { signOut, signIn } from 'next-auth/react';

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength checks
  const checks = {
    length: formData.newPassword.length >= 12,
    uppercase: /[A-Z]/.test(formData.newPassword),
    lowercase: /[a-z]/.test(formData.newPassword),
    number: /[0-9]/.test(formData.newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword),
    match: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async () => {
    if (!allValid) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: session?.user?.employeeNumber,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);

      // Wait 2 seconds then sign out and redirect to login
      // This clears the old JWT token that still has isFirstLogin: true
      // Employee will login again with their new password
      setTimeout(async () => {
        await signOut({ redirect: false });
        router.push('/');
      }, 2000);

    } catch (err) {
      console.error('Password change error:', err);
      setError('Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  const CheckItem = ({ valid, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${valid ? 'text-green-600' : 'text-gray-400'}`}>
      {valid 
        ? <Check size={14} className="flex-shrink-0" /> 
        : <X size={14} className="flex-shrink-0" />
      }
      <span>{text}</span>
    </div>
  );

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Password Set Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Your password has been created. Redirecting to your dashboard...
          </p>
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-gray-600 mt-2">
            Welcome! For security, please create a password for your account.
          </p>
          {session?.user?.name && (
            <p className="text-orange-600 font-semibold mt-1">
              {session.user.name}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* New Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
              placeholder="Enter new password"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
              placeholder="Confirm new password"
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Password Requirements:
          </p>
          <CheckItem valid={checks.length} text="At least 12 characters" />
          <CheckItem valid={checks.uppercase} text="One uppercase letter (A-Z)" />
          <CheckItem valid={checks.lowercase} text="One lowercase letter (a-z)" />
          <CheckItem valid={checks.number} text="One number (0-9)" />
          <CheckItem valid={checks.special} text="One special character (!@#$...)" />
          <CheckItem valid={checks.match} text="Passwords match" />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!allValid || loading}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
            allValid && !loading
              ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Setting Password...</span>
            </div>
          ) : (
            'Set Password & Continue'
          )}
        </button>
      </div>
    </div>
  );
}