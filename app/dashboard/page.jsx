'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, User, Mail, LogOut, Calendar, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const [employee, setEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
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

    // Fetch full employee details
    fetch(`/api/employee/${emp.id}`)
      .then(res => res.json())
      .then(data => {
        setEmployeeDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching employee details:', err);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('employee');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your information...</p>
        </div>
      </div>
    );
  }

  if (!employee || !employeeDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading employee data</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Return to Login
          </button>
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
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Luna County</h1>
                <p className="text-xs text-gray-500">Employee Self-Service</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {employee.firstName?.charAt(0)}{employee.name?.split(' ')[1]?.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                <p className="text-xs text-gray-500">{employee.id}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {employeeDetails.name.first}!
          </h2>
          <p className="text-gray-600">Here is your employee dashboard</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <Calendar size={32} className="text-white opacity-80" />
              <span className="text-xs bg-white bg-opacity-30 px-3 py-1 rounded-full font-semibold text-gray-500">
                {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Department</p>
            <p className="text-2xl font-bold">{employeeDetails.department}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <Briefcase size={32} className="text-white opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Position</p>
            <p className="text-2xl font-bold">{employeeDetails.position}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <User size={32} className="text-white opacity-80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Hire Date</p>
            <p className="text-2xl font-bold">{employeeDetails.hireDate}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/paystubs')}
              className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl hover:border-orange-400 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <FileText className="text-white" size={28} />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">Pay Stubs</p>
              <p className="text-sm text-gray-600">View payment history</p>
            </button>

            <button 
              onClick={() => router.push('/employee-info')}
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <User className="text-white" size={28} />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">My Info</p>
              <p className="text-sm text-gray-600">Personal details</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:shadow-lg transition-all group opacity-50 cursor-not-allowed">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <FileText className="text-white" size={28} />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">W-2 Forms</p>
              <p className="text-sm text-gray-600">Coming soon</p>
            </button>

            <button 
              onClick={() => router.push('/contact')}
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <Mail className="text-white" size={28} />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">Contact HR</p>
              <p className="text-sm text-gray-600">Get help</p>
            </button>
          </div>
        </div>

        {/* Employee Details Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Employment Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-lg font-semibold text-gray-900">{employeeDetails.employment.status}</p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employment Type</p>
              <p className="text-lg font-semibold text-gray-900">{employeeDetails.employment.type}</p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employee Number</p>
              <p className="text-lg font-semibold text-gray-900">{employeeDetails.employeeNumber}</p>
            </div>
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</p>
              <p className="text-lg font-semibold text-gray-900">{employeeDetails.dateOfBirth}</p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-6 bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">📢</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">Important Notice</h4>
              <p className="text-gray-700">
                This portal provides secure access to your personal employment information. If you notice any discrepancies in your records, please contact HR immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}