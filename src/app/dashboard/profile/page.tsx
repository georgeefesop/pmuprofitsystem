'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  
  // User profile state
  const [userData, setUserData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: '',
  });

  // Form validation state
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Initialize phone number from user data if available
  useEffect(() => {
    if (user) {
      setUserData({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, [user]);
  
  // Handle profile form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user types
    setErrors({
      ...errors,
      [name]: '',
    });

    if (name === 'phone') {
      // Only allow digits, spaces, parentheses, dashes, and plus sign
      const formattedValue = value.replace(/[^\d\s()+\-]/g, '');
      setUserData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user types
    setPasswordErrors({
      ...passwordErrors,
      [name]: '',
    });
    
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validate full name
    if (!userData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else if (userData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    }

    // Validate phone (optional but must be valid if provided)
    if (userData.phone && !isValidPhoneNumber(userData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate phone number format
  const isValidPhoneNumber = (phone: string): boolean => {
    // Allow international format with + and country code, or local format
    // This is a basic validation - adjust as needed for specific requirements
    const phoneRegex = /^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return phoneRegex.test(phone);
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...passwordErrors };

    // Validate current password
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Validate confirm password
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setPasswordErrors(newErrors);
    return isValid;
  };
  
  // Handle profile form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!validateProfileForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, you would update the user profile via API
      console.log('Profile updated:', userData);
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  // Handle password form submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, you would update the password via API
      console.log('Password updated');
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>Your changes have been saved successfully!</p>
          </div>
        )}
        
        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={userData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="Your full name"
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                  placeholder="your@email.com"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone ? (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Enter your phone number with country code (e.g., +1 for US)</p>
                )}
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Account Security */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Account Security</h2>
            <p className="text-gray-600 mb-6">
              Use the form below to change your password. For security reasons, you'll need to enter your current password.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="Enter your current password"
                  required
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="Enter new password"
                  required
                />
                {passwordErrors.newPassword ? (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="Confirm new password"
                  required
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Purchase Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Purchase Information</h2>
            
            <div className="space-y-6">
              {/* PMU Profit System */}
              {usePurchases().hasPurchased('pmu-profit-system') && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">PMU Profit System</h3>
                      <p className="text-sm text-gray-600">Complete Marketing & Business Growth Course</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {usePurchases().purchases
                        .filter(purchase => purchase.product_id === 'pmu-profit-system')
                        // Take only the first purchase record to avoid duplicates
                        .slice(0, 1)
                        .map(purchase => (
                          <React.Fragment key={purchase.id}>
                            <div>
                              <dt className="text-gray-500">Purchase Date</dt>
                              <dd className="font-medium text-gray-900">
                                {new Date(purchase.created_at).toLocaleDateString()}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Order ID</dt>
                              <dd className="font-medium text-gray-900">
                                {purchase.id.substring(0, 8)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Amount</dt>
                              <dd className="font-medium text-gray-900">
                                €{(purchase.amount / 100).toFixed(2)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Access</dt>
                              <dd className="font-medium text-gray-900">
                                Lifetime
                              </dd>
                            </div>
                          </React.Fragment>
                        ))}
                    </dl>
                  </div>
                </div>
              )}
              
              {/* Consultation Success Blueprint */}
              <PurchaseItem 
                title="Consultation Success Blueprint"
                description="Framework for Converting Consultations into Bookings"
                productId="consultation-success-blueprint"
                accessType="Lifetime"
                viewLink="/dashboard/blueprint"
                viewText="View Blueprint"
                purchaseLink="/dashboard/blueprint/purchase"
              />
              
              {/* PMU Ad Generator */}
              <PurchaseItem 
                title="PMU Ad Generator"
                description="AI-Powered Ad Creation Tool for PMU Artists"
                productId="pmu-ad-generator"
                accessType="Lifetime"
                viewLink="/dashboard/ad-generator"
                viewText="Use Ad Generator"
                purchaseLink="/dashboard/ad-generator/purchase"
              />
            </div>
          </div>
        </div>
        
        {/* Account Deletion */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h2>
            <p className="text-gray-600 mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <Link 
              href="/dashboard/profile/delete-account" 
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Purchase Item Component
function PurchaseItem({ 
  title, 
  description, 
  productId,
  accessType,
  viewLink,
  viewText,
  purchaseLink
}: { 
  title: string; 
  description: string; 
  productId: string;
  accessType: string;
  viewLink: string;
  viewText: string;
  purchaseLink: string;
}) {
  const { hasPurchased, purchases } = usePurchases();
  const isPurchased = hasPurchased(productId as any);
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="mt-2 md:mt-0">
          {isPurchased ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <Link 
              href={purchaseLink}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Purchase Now
            </Link>
          )}
        </div>
      </div>
      
      {isPurchased ? (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {purchases
              .filter(purchase => purchase.product_id === productId)
              // Take only the first purchase record to avoid duplicates
              .slice(0, 1)
              .map(purchase => (
                <React.Fragment key={purchase.id}>
                  <div>
                    <dt className="text-gray-500">Purchase Date</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Order ID</dt>
                    <dd className="font-medium text-gray-900">
                      {purchase.id.substring(0, 8)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Amount</dt>
                    <dd className="font-medium text-gray-900">
                      €{(purchase.amount / 100).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Access</dt>
                    <dd className="font-medium text-gray-900">
                      {accessType}
                    </dd>
                  </div>
                </React.Fragment>
              ))}
          </dl>
        </div>
      ) : (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Purchase this add-on to enhance your PMU business growth.
          </p>
        </div>
      )}
    </div>
  );
} 