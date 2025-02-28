'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in cookies on initial load
    const storedUser = Cookies.get('pmu_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from cookie:', e);
        Cookies.remove('pmu_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in a real app, this would call an API
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, any email/password combination works
    // In a real app, you would validate credentials against your backend
    
    // Try to get the stored user with this email to preserve their name
    const storedUsers = localStorage.getItem('pmu_users');
    let userRecord = null;
    
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      userRecord = users.find((u: any) => u.email === email);
    }
    
    const mockUser = {
      id: '1',
      email,
      name: userRecord?.name || email, // Use stored name or email as fallback
    };
    
    setUser(mockUser);
    // Store in both localStorage (for backward compatibility) and cookies (for middleware)
    localStorage.setItem('pmu_user', JSON.stringify(mockUser));
    Cookies.set('pmu_user', JSON.stringify(mockUser), { expires: 7 }); // Expires in 7 days
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pmu_user');
    Cookies.remove('pmu_user');
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock registration - in a real app, this would call an API
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userId = Date.now().toString();
    
    const mockUser = {
      id: userId,
      email,
      name: name || email, // Use provided name or email as fallback
    };
    
    // Store user in a "database" (localStorage)
    const storedUsers = localStorage.getItem('pmu_users') || '[]';
    const users = JSON.parse(storedUsers);
    users.push({
      id: userId,
      email,
      name,
      password, // In a real app, you would NEVER store passwords in plain text
    });
    localStorage.setItem('pmu_users', JSON.stringify(users));
    
    // Log the user in
    setUser(mockUser);
    localStorage.setItem('pmu_user', JSON.stringify(mockUser));
    Cookies.set('pmu_user', JSON.stringify(mockUser), { expires: 7 }); // Expires in 7 days
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 