'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function EnvironmentMismatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userEnv, setUserEnv] = useState<string | null>(null);
  const [currentEnv, setCurrentEnv] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get environment information from URL parameters
    const userEnvironment = searchParams.get('userEnv');
    const currentEnvironment = searchParams.get('currentEnv');
    const errorMessage = searchParams.get('error');

    setUserEnv(userEnvironment);
    setCurrentEnv(currentEnvironment);
    setError(errorMessage);

    // Log for debugging
    console.log('Environment mismatch page loaded with params:', {
      userEnv: userEnvironment,
      currentEnv: currentEnvironment,
      error: errorMessage
    });
  }, [searchParams]);

  const getUserEnvName = (env: string | null): string => {
    if (!env) return 'Unknown';
    return env === 'local' ? 'Local Development' : 'Production';
  };

  const getCurrentEnvName = (env: string | null): string => {
    if (!env) return 'Unknown';
    return env === 'local' ? 'Local Development' : 'Production';
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Environment Mismatch
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your account cannot be accessed from this environment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              For security reasons, accounts can only be accessed from the environment where they were created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      {error || `This account was created in the ${getUserEnvName(userEnv)} environment and cannot be accessed from the ${getCurrentEnvName(currentEnv)} environment.`}
                    </p>
                    <p className="mt-2 text-sm text-amber-700">
                      <strong>Why is this happening?</strong> Your account exists in our database, but you're trying to access it from a different environment than where it was created.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-800">What should I do?</h3>
                <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>If you're a developer testing the application, create a new account in this environment.</li>
                  <li>If you're a user, make sure you're accessing the application from the same environment where you created your account.</li>
                  <li>If you need to migrate your account, please contact support.</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 