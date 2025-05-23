import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: number;
  email: string;
  role: string;
  // Add other user properties if needed
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean; // Indicates if we are still trying to load user from storage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On initial load, try to get user from localStorage
    // This is a simple way to persist login state on the client-side
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    // Future: Call an API endpoint to invalidate server-side session if using httpOnly cookies or server sessions
    // For now, this handles client-side logout.
    // Redirect to home or login page after logout
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'; // Or '/' for homepage
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
