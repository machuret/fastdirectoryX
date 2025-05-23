import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const Wrapper: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) { // Only check after attempting to load user from storage
        if (!user) {
          router.replace('/auth/login?message=Please log in to access this page');
        } else if (user.role !== 'ADMIN') {
          router.replace('/?message=You do not have permission to access this page'); // Or a dedicated 'unauthorized' page
        }
      }
    }, [user, loading, router]);

    // Show a loading state or nothing while checking auth and role
    if (loading || !user || user.role !== 'ADMIN') {
      // You can render a loading spinner or a blank page here
      // For simplicity, returning null will prevent rendering the wrapped component until authorized
      return null; 
    }

    return <WrappedComponent {...props} />;
  };

  // Set a display name for easier debugging in React DevTools
  Wrapper.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return Wrapper;
};

export default withAdminAuth;
