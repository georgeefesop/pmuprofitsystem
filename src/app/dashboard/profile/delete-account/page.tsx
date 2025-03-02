'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function DeleteAccountPage() {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmChecks, setConfirmChecks] = useState({
    loseAccess: false,
    permanentDelete: false,
  });
  
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const allChecksConfirmed = Object.values(confirmChecks).every(Boolean);
  const canProceed = password && confirmText === 'DELETE' && allChecksConfirmed;
  
  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setConfirmChecks(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // API call to delete account would go here
      // const response = await fetch('/api/user/delete', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password, reason })
      // });
      
      // if (!response.ok) throw new Error('Failed to delete account');
      
      // Send email notification about account deletion
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'pmuprofitsystem@gmail.com',
            subject: 'Account Deletion Notification',
            text: `
              User Account Deletion:
              
              Email: ${user?.email}
              Name: ${user?.full_name}
              Reason for deletion: ${reason || 'No reason provided'}
              
              This account has been deleted from the PMU Profit System.
            `
          })
        });
      } catch (emailError) {
        console.error('Failed to send deletion notification email:', emailError);
        // Continue with deletion even if email fails
      }
      
      // For demo, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the user out
      logout();
      
      // Redirect to deletion confirmation page
      router.push('/account-deleted');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DashboardLayout title="Delete Account">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Delete Your Account</h2>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">Warning: This action cannot be undone</p>
            <p className="text-red-700 text-sm">
              Deleting your account will permanently remove all your data, including your profile information,
              course progress, and purchase history. You will lose access to all purchased courses and materials.
            </p>
          </div>
          
          <form onSubmit={handleDeleteAccount} className="space-y-6">
            {/* Confirmation Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="loseAccess"
                  name="loseAccess"
                  checked={confirmChecks.loseAccess}
                  onChange={handleCheckChange}
                  className="mt-1 mr-3"
                />
                <label htmlFor="loseAccess" className="text-sm text-gray-700">
                  I understand that I will lose access to all courses and materials I have purchased.
                </label>
              </div>
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="permanentDelete"
                  name="permanentDelete"
                  checked={confirmChecks.permanentDelete}
                  onChange={handleCheckChange}
                  className="mt-1 mr-3"
                />
                <label htmlFor="permanentDelete" className="text-sm text-gray-700">
                  I understand that all my data will be permanently deleted and cannot be recovered.
                </label>
              </div>
            </div>
            
            {/* Reason for Leaving (Optional) */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Why are you deleting your account? (Optional)
              </label>
              <select
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason</option>
                <option value="not-useful">The content wasn't useful for me</option>
                <option value="too-expensive">Too expensive</option>
                <option value="found-alternative">Found an alternative solution</option>
                <option value="privacy-concerns">Privacy concerns</option>
                <option value="temporary">Temporary break, will return later</option>
                <option value="other">Other reason</option>
              </select>
            </div>
            
            {/* Password Verification */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            {/* Final Confirmation */}
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                id="confirmText"
                name="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE in all caps"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard/profile')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!canProceed || isLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  canProceed && !isLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Delete Account Permanently'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 