'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Users, Lock, Bell, Activity, Unlock, RefreshCw,
  LogOut, Shield, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/'); return; }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.status === 403) { router.push('/dashboard'); return; }
      const data = await res.json();
      setStats(data.stats);
      setAccounts(data.accounts);
      setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUnlock = async (empNum) => {
    setActionLoading(empNum + '-unlock');
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNumber: empNum }),
      });
      if (res.ok) {
        showMessage('success', `Account #${empNum} unlocked successfully.`);
        fetchData();
      } else {
        showMessage('error', 'Failed to unlock account.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (empNum) => {
    if (!confirm(`Reset password for employee #${empNum}?\n\nThey will be required to set a new password on their next login.`)) return;
    setActionLoading(empNum + '-reset');
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNumber: empNum }),
      });
      if (res.ok) {
        showMessage('success', `Account #${empNum} reset — employee must set a new password.`);
        fetchData();
      } else {
        showMessage('error', 'Failed to reset account.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (account) => {
    const locked = account.lockout_until &&
      new Date(account.lockout_until.replace(' ', 'T') + 'Z') > new Date();
    if (locked) return { label: 'Locked', className: 'bg-red-100 text-red-700 border border-red-300' };
    if (account.is_first_login) return { label: 'Pending Setup', className: 'bg-yellow-100 text-yellow-700 border border-yellow-300' };
    return { label: 'Active', className: 'bg-green-100 text-green-700 border border-green-300' };
  };

  const isLocked = (account) =>
    account.lockout_until &&
    new Date(account.lockout_until.replace(' ', 'T') + 'Z') > new Date();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">{countyName.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{countyName}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield size={10} /> Admin Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
              >
                Employee View
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Toast */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-300 text-green-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}>
            {message.type === 'success'
              ? <CheckCircle size={18} />
              : <AlertTriangle size={18} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Page title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage employee accounts and monitor portal activity</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
              <Users size={26} className="mb-3 opacity-80" />
              <p className="text-blue-100 text-xs font-medium mb-1">Registered</p>
              <p className="text-4xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
              <Lock size={26} className="mb-3 opacity-80" />
              <p className="text-red-100 text-xs font-medium mb-1">Locked Now</p>
              <p className="text-4xl font-bold">{stats.locked}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
              <Bell size={26} className="mb-3 opacity-80" />
              <p className="text-violet-100 text-xs font-medium mb-1">Push Enabled</p>
              <p className="text-4xl font-bold">{stats.pushSubs}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
              <Activity size={26} className="mb-3 opacity-80" />
              <p className="text-emerald-100 text-xs font-medium mb-1">Logins Today</p>
              <p className="text-4xl font-bold">{stats.recentLogins}</p>
            </div>
          </div>
        )}

        {/* Accounts — mobile cards */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Employee Accounts</h3>
            <p className="text-sm text-gray-500 mt-1">Employees who have registered in the portal</p>
          </div>

          {/* Mobile view */}
          <div className="block sm:hidden divide-y divide-gray-100">
            {accounts.length === 0 && (
              <p className="p-6 text-center text-gray-400">No registered accounts yet.</p>
            )}
            {accounts.map(account => {
              const badge = getStatusBadge(account);
              const locked = isLocked(account);
              return (
                <div key={account.employee_number} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-gray-900 text-lg">#{account.employee_number}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Last login: {formatDate(account.last_login)}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {account.push_count > 0 ? '🔔 Push on' : '🔕 No push'} &nbsp;·&nbsp; {account.failed_attempts} failed attempt{account.failed_attempts !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    {locked && (
                      <button
                        onClick={() => handleUnlock(account.employee_number)}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <Unlock size={14} />
                        {actionLoading === account.employee_number + '-unlock' ? 'Unlocking…' : 'Unlock'}
                      </button>
                    )}
                    <button
                      onClick={() => handleReset(account.employee_number)}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-50 border border-orange-300 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={14} />
                      {actionLoading === account.employee_number + '-reset' ? 'Resetting…' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Emp #</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Push</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Failed</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No registered accounts yet.</td>
                  </tr>
                )}
                {accounts.map(account => {
                  const badge = getStatusBadge(account);
                  const locked = isLocked(account);
                  return (
                    <tr key={account.employee_number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">#{account.employee_number}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(account.last_login)}</td>
                      <td className="px-6 py-4 text-sm">
                        {account.push_count > 0
                          ? <span className="text-violet-600 font-medium">Enabled</span>
                          : <span className="text-gray-400">Off</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={account.failed_attempts > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                          {account.failed_attempts}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {locked && (
                            <button
                              onClick={() => handleUnlock(account.employee_number)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-300 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              <Unlock size={12} />
                              {actionLoading === account.employee_number + '-unlock' ? 'Unlocking…' : 'Unlock'}
                            </button>
                          )}
                          <button
                            onClick={() => handleReset(account.employee_number)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-300 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={12} />
                            {actionLoading === account.employee_number + '-reset' ? 'Resetting…' : 'Reset PW'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Recent Login Activity</h3>
            <p className="text-sm text-gray-500 mt-1">Last 25 login attempts across all employees</p>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400">No login activity recorded yet.</p>
            )}
            {recentActivity.map(attempt => (
              <div key={attempt.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    attempt.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {attempt.success
                      ? <CheckCircle size={16} className="text-green-600" />
                      : <AlertTriangle size={16} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Employee #{attempt.employee_number}</p>
                    <p className="text-xs text-gray-500">{attempt.ip_address || 'Unknown IP'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${attempt.success ? 'text-green-600' : 'text-red-500'}`}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {formatDate(attempt.attempted_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
