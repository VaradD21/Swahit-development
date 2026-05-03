'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function RoleGuard({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Basic implementation reading from local storage (or context in a real app)
    const token = localStorage.getItem('token');
    // Assuming for MVP that role is stored locally or decoded from token
    const userRole = localStorage.getItem('userRole') || 'USER'; 
    
    if (!token) {
      router.push('/login');
    } else if (!allowedRoles.includes(userRole)) {
      router.push('/dashboard');
    } else {
      setIsAuthorized(true);
    }
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
