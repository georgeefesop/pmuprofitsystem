// Server component
import DashboardClient from '@/components/DashboardClient';

// Set revalidation for this page
export const revalidate = 60; // Revalidate every 60 seconds

export default function DashboardPage() {
  return <DashboardClient />;
} 