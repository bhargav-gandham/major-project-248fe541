import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for each role
const demoUsers: Record<UserRole, User> = {
  admin: {
    id: 'admin-1',
    name: 'Dr. Sarah Mitchell',
    email: 'admin@edumanage.com',
    role: 'admin',
  },
  faculty: {
    id: 'faculty-1',
    name: 'Prof. James Anderson',
    email: 'faculty@edumanage.com',
    role: 'faculty',
  },
  student: {
    id: 'student-1',
    name: 'Alex Thompson',
    email: 'student@edumanage.com',
    role: 'student',
  },
  parent: {
    id: 'parent-1',
    name: 'Michael Thompson',
    email: 'parent@edumanage.com',
    role: 'parent',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Demo authentication - in production, this would call the backend
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (password.length >= 4) {
      setUser(demoUsers[role]);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
