'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, MapPin, Phone, Calendar, Briefcase, Shield, Mail } from 'lucide-react';

export default function EmployeeInfoPage() {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Information</h2>
          <p className="text-gray-600">View your personal employment details</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <User size={48} className="text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">{employeeDetails.name.full}</h3>
                <div className="flex items-center space-x-4 text-orange-100">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={16} />
                    <span className="text-sm font-medium">{employeeDetails.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield size={16} />
                    <span className="text-sm font-medium">{employeeDetails.department}</span>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-black">{employeeDetails.employment.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Personal Information</h4>
            </div>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.name.full}</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employee Number</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.employeeNumber}</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Social Security Number</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">{employeeDetails.ssn}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.dateOfBirth}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Contact Information</h4>
            </div>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.address.street}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {employeeDetails.address.city}, {employeeDetails.address.state} {employeeDetails.address.zip}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">County</p>
                <p className="text-lg font-semibold text-gray-900">Lea County, New Mexico</p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Employment Details</h4>
            </div>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Position</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.position}</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Department</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.department}</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employment Type</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.employment.type}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employment Status</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-lg font-semibold text-gray-900">{employeeDetails.employment.permanent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hire Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Hire Information</h4>
            </div>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hire Date</p>
                <p className="text-lg font-semibold text-gray-900">{employeeDetails.hireDate}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Years of Service</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const hireDate = new Date(employeeDetails.hireDate);
                    const today = new Date();
                    const years = today.getFullYear() - hireDate.getFullYear();
                    return `${years} years`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">ℹ️</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">Need to Update Your Information?</h4>
              <p className="text-gray-700 mb-3">
                If you notice any errors or need to update your personal information, please contact the Human Resources department.
              </p>
              <button
                onClick={() => router.push('/contact')}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Mail size={16} />
                <span>Contact HR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}