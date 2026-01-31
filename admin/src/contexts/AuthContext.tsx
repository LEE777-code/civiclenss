import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  adminEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo Users Configuration
// Demo Users Configuration
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'admin123';

const DEMO_USERS: Record<string, { password: string; email: string }> = {
  'admin': { password: DEMO_PASSWORD, email: 'admin123@gmail.com' },
  'tneb': { password: DEMO_PASSWORD, email: 'tneb_chennai@civiclens.com' },
  'water': { password: DEMO_PASSWORD, email: 'water_madurai@civiclens.com' },
  'roads': { password: DEMO_PASSWORD, email: 'roads_coimbatore@civiclens.com' },
  'health': { password: DEMO_PASSWORD, email: 'health_salem@civiclens.com' }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedAuth = localStorage.getItem('admin_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed && parsed.email) {
          setIsAuthenticated(true);
          setAdminEmail(parsed.email);
        }
      } catch (e) {
        // Handle legacy "authenticated" string or invalid JSON
        console.warn('Legacy auth token detected, clearing session.');
        localStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = DEMO_USERS[username.toLowerCase()];

    if (user && user.password === password) {
      setIsAuthenticated(true);
      setAdminEmail(user.email);
      localStorage.setItem('admin_auth', JSON.stringify({ status: 'authenticated', email: user.email }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminEmail('');
    localStorage.removeItem('admin_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, adminEmail }}>
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
