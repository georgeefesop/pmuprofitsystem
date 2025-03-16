'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuthState } from "@/hooks/useAuthState";
import { UserEntitlements } from "@/components/UserEntitlements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isLoading, refreshUser, signOut } = useAuthState();
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const router = useRouter();

  // Load user data into form when available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/dashboard/profile');
    }
  }, [isLoading, user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const { error } = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
        }),
      }).then(res => res.json());

      if (error) {
        throw new Error(error);
      }

      // Refresh user data to show updated profile
      await refreshUser();
      setUpdateSuccess(true);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="My Profile">
        <div className="p-6 bg-red-50 text-red-800 rounded-md">
          <p>You must be logged in to view this page.</p>
          <Link href="/login?redirect=/dashboard/profile" className="mt-4 inline-block text-red-600 hover:text-red-800 underline">
            Go to login page
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Account Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {updateSuccess && (
                <p className="text-sm text-green-600">
                  Profile updated successfully!
                </p>
              )}

              <div className="flex justify-between">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Purchases Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Purchases</CardTitle>
            <CardDescription>
              View all your active products and subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserEntitlements />
          </CardContent>
        </Card>
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
                </React.Fragment>
              ))}
          </dl>
          
          <div className="mt-4">
            <Link 
              href={viewLink}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {viewText}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
} 