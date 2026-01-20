import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import FacultyDashboard from '@/components/dashboard/FacultyDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
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
      return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
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
