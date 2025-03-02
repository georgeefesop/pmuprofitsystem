import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DiagnosticsNotFound() {
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Page Not Available
          </CardTitle>
          <CardDescription>
            The diagnostics page is not available in production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            For security reasons, diagnostic tools are only accessible in development environments.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/" passHref>
            <Button>Return to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 