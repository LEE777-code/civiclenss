import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Admin } from '@/lib/supabase';
import { authService } from '@/services/authService';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmin = async () => {
    if (!user?.id) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const adminData = await authService.getAdminByClerkId(user.id);
      setAdmin(adminData);
    } catch (error) {
      console.error('Error fetching admin:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchAdmin();
    }
  }, [user?.id, isLoaded]);

  return (
    <AuthContext.Provider value={{ admin, loading, refreshAdmin: fetchAdmin }}>
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
