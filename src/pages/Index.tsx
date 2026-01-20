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
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-setup');
        
        if (error) {
          console.error('Setup check error:', error);
          // If error, assume setup is done and show login
          setNeedsSetup(false);
        } else {
          setNeedsSetup(data?.needs_setup ?? false);
        }
      } catch (err) {
        console.error('Setup check failed:', err);
        setNeedsSetup(false);
      } finally {
        setCheckingSetup(false);
      }
    };
    
    if (!isAuthenticated) {
      checkSetup();
    } else {
      setCheckingSetup(false);
      setNeedsSetup(false);
    }
  }, [isAuthenticated]);

  if (isLoading || checkingSetup) {
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
