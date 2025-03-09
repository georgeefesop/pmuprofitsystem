import { useEntitlements } from '@/hooks/useEntitlements';

export default function Dashboard() {
  // Use the entitlements hook
  const { 
    entitlements, 
    isLoading: entitlementsLoading, 
    error: entitlementsError, 
    hasActiveEntitlements 
  } = useEntitlements();

  // Define loading state
  const isLoading = entitlementsLoading;

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Show error state
  if (entitlementsError) {
    return <div>Error: {entitlementsError}</div>;
  }

  // Show content based on entitlements
  return (
    <div>
      {hasActiveEntitlements ? (
        <div>Dashboard content for users with entitlements</div>
      ) : (
        <div>You don't have access to this content</div>
      )}
    </div>
  );
} 