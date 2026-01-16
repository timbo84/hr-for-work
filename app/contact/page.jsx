'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    urgency: 'normal'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending email (in production, this would call an API endpoint)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ subject: '', message: '', urgency: 'normal' });
      }, 3000);
    }, 1500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your message has been sent to Human Resources. They will respond to you as soon as possible.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium"
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Human Resources</h2>
          <p className="text-gray-600">Get help with your questions or concerns</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Information Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* HR Contact Card */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="w-14 h-14 bg-white bg-opacity-30 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <Mail size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">HR Department</h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail size={18} className="text-purple-100 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-purple-100 font-medium mb-1">Email</p>
                    <a href="mailto:hr@leacounty.gov" className="text-white font-semibold hover:underline">
                      hr@leacounty.gov
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone size={18} className="text-purple-100 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-purple-100 font-medium mb-1">Phone</p>
                    <a href="tel:+15555551234" className="text-white font-semibold hover:underline">
                      (555) 555-1234
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin size={18} className="text-purple-100 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-purple-100 font-medium mb-1">Office Location</p>
                    <p className="text-white font-semibold">
                      100 N. Main Avenue<br />
                      Lovington, NM 88260
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock size={18} className="text-purple-100 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-purple-100 font-medium mb-1">Office Hours</p>
                    <p className="text-white font-semibold">
                      Monday - Friday<br />
                      8:00 AM - 5:00 PM MST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">💡</span>
                Quick Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Include your employee number in your message</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Be specific about your question or concern</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Allow 1-2 business days for a response</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>For urgent matters, call the office directly</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-500"
                  >
                    <option value="">Select a subject...</option>
                    <option value="general">General Question</option>
                    <option value="benefits">Benefits Inquiry</option>
                    <option value="payroll">Payroll Issue</option>
                    <option value="pto">Time Off / PTO</option>
                    <option value="personal-info">Update Personal Information</option>
                    <option value="w2">W-2 Forms</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgency: 'low' }))}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-gray-500 ${formData.urgency === 'low'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgency: 'normal' }))}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-gray-500 ${formData.urgency === 'normal'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgency: 'high' }))}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-gray-500 ${formData.urgency === 'high'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      High
                    </button>
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="8"
                    placeholder="Please describe your question or concern in detail..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none text-gray-500"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.message.length} characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="text-red-500">*</span> Required fields
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !formData.subject || !formData.message}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Additional Help */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📞</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Need Immediate Assistance?</h4>
                  <p className="text-gray-700 mb-3">
                    For urgent matters that require immediate attention, please call the HR office directly during business hours.
                  </p>
                  <a href="tel:+15555551234"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <Phone size={16} />
                    <span>Call (555) 555-1234</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}