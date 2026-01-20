import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoginPage from '@/components/auth/LoginPage';
import SetupPage from '@/components/auth/SetupPage';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import FacultyDashboard from '@/components/dashboard/FacultyDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSetup = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      
      setNeedsSetup(!data || data.length === 0);
    };
    
    if (!isAuthenticated) {
      checkSetup();
    }
  }, [isAuthenticated]);

  if (isLoading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsSetup && !isAuthenticated) {
    return <SetupPage onComplete={() => setNeedsSetup(false)} />;
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <LoginPage />;
  }
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
