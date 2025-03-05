'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function PreferencesPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    // Notification preferences
    emailNotifications: true,
    courseUpdates: true,
    marketingEmails: false,
    
    // Display preferences
    darkMode: false,
    compactView: false,
    autoPlayVideos: true,
    
    // Privacy preferences
    shareProgress: true,
    showProfilePublicly: false,
    allowDataCollection: true,
  });

  // Load preferences (mock data for now)
  useEffect(() => {
    // In a real app, you would fetch preferences from an API or localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Failed to parse saved preferences', e);
      }
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      // In a real app, you would save this to an API
      localStorage.setItem('userPreferences', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSavePreferences = () => {
    // In a real app, you would save all preferences to an API
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // Show success message
    alert('Preferences saved successfully!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row flex-1">
        {/* Mobile Sidebar Toggle Button */}
        <div className="md:hidden bg-purple-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">PMU Profit System</h2>
          <button 
            className="text-white p-2 focus:outline-none"
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              if (sidebar) {
                sidebar.classList.toggle('hidden');
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Sidebar */}
        <aside id="sidebar" className="hidden md:block w-64 bg-purple-800 text-white shrink-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">PMU Profit System</h2>
              <button 
                className="md:hidden text-white focus:outline-none"
                onClick={() => {
                  const sidebar = document.getElementById('sidebar');
                  if (sidebar) {
                    sidebar.classList.add('hidden');
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-1">
              <Link href="/dashboard" className="block py-2.5 px-4 rounded hover:bg-purple-700 text-white font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard/modules" className="block py-2.5 px-4 rounded hover:bg-purple-700 text-white font-medium">
                All Modules
              </Link>
              <div className="py-2 px-4 text-purple-200 text-sm font-medium">BONUS MATERIALS</div>
              <Link href="/dashboard/blueprint" className="block py-2.5 px-4 rounded hover:bg-purple-700 text-white font-medium">
                Consultation Blueprint
              </Link>
              <Link href="/dashboard/profile" className="block py-2.5 px-4 rounded bg-purple-700 text-white font-medium">
                My Profile
              </Link>
            </nav>
          </div>
          
          <div className="p-6 border-t border-purple-700 mt-6">
            <Link href="/logout" className="block text-sm text-white hover:text-purple-200">
              Logout
            </Link>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow">
            <div className="py-4 px-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center">
                <button 
                  className="mr-4 md:hidden text-gray-700 focus:outline-none"
                  onClick={() => {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) {
                      sidebar.classList.remove('hidden');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Preferences</h1>
                  <p className="text-sm text-gray-500">Customize your experience</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link 
                  href="/dashboard/profile" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Profile
                </Link>
                <button
                  onClick={handleSavePreferences}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Preferences
                </button>
              </div>
            </div>
          </header>
          
          <div className="p-8 flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Notification Preferences */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive important updates about your account</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.emailNotifications}
                        onChange={() => handleToggle('emailNotifications')}
                      />
                      <label
                        htmlFor="emailNotifications"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.emailNotifications ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.emailNotifications ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Course Updates</p>
                      <p className="text-sm text-gray-500">Receive notifications about new course content</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="courseUpdates"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.courseUpdates}
                        onChange={() => handleToggle('courseUpdates')}
                      />
                      <label
                        htmlFor="courseUpdates"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.courseUpdates ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.courseUpdates ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive promotional offers and marketing updates</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="marketingEmails"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.marketingEmails}
                        onChange={() => handleToggle('marketingEmails')}
                      />
                      <label
                        htmlFor="marketingEmails"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.marketingEmails ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.marketingEmails ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Preferences */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-500">Use dark theme for the dashboard</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="darkMode"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.darkMode}
                        onChange={() => handleToggle('darkMode')}
                      />
                      <label
                        htmlFor="darkMode"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.darkMode ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.darkMode ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact View</p>
                      <p className="text-sm text-gray-500">Show more content with less spacing</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="compactView"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.compactView}
                        onChange={() => handleToggle('compactView')}
                      />
                      <label
                        htmlFor="compactView"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.compactView ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.compactView ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Play Videos</p>
                      <p className="text-sm text-gray-500">Automatically play videos when viewing modules</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="autoPlayVideos"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.autoPlayVideos}
                        onChange={() => handleToggle('autoPlayVideos')}
                      />
                      <label
                        htmlFor="autoPlayVideos"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.autoPlayVideos ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.autoPlayVideos ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Privacy Preferences */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Privacy Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Share Progress</p>
                      <p className="text-sm text-gray-500">Allow us to use your progress data for improving the course</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="shareProgress"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.shareProgress}
                        onChange={() => handleToggle('shareProgress')}
                      />
                      <label
                        htmlFor="shareProgress"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.shareProgress ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.shareProgress ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-gray-500">Make your profile visible to other PMU artists</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="showProfilePublicly"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.showProfilePublicly}
                        onChange={() => handleToggle('showProfilePublicly')}
                      />
                      <label
                        htmlFor="showProfilePublicly"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.showProfilePublicly ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.showProfilePublicly ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Collection</p>
                      <p className="text-sm text-gray-500">Allow us to collect usage data to improve our services</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        id="allowDataCollection"
                        className="opacity-0 w-0 h-0"
                        checked={preferences.allowDataCollection}
                        onChange={() => handleToggle('allowDataCollection')}
                      />
                      <label
                        htmlFor="allowDataCollection"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${
                          preferences.allowDataCollection ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            preferences.allowDataCollection ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Data Export & Deletion */}
              <div className="bg-purple-50 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                <p className="text-gray-600 mb-6">
                  You can export your data or request deletion of your account and associated data.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export My Data
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 