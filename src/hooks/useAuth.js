import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    checkAuth();
  }, [session, status]);

  const checkAuth = async () => {
    try {
      // Check NextAuth session first (for Google OAuth users)
      if (session?.user) {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Fallback to session data
            setUser({
              ...session.user,
              isGoogleUser: true,
              books: session.user.books || [],
              exchanges: session.user.exchanges || [],
              profilePicture: session.user.image
            });
          }
        } catch (error) {
          // Fallback to session data
          setUser({
            ...session.user,
            isGoogleUser: true,
            books: session.user.books || [],
            exchanges: session.user.exchanges || [],
            profilePicture: session.user.image
          });
        }
        setLoading(false);
        return;
      }

      // Fallback to JWT token (for regular email/password users)
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    
    if (session) {
      // NextAuth logout
      await signOut({ callbackUrl: '/' });
    } else {
      // JWT logout
      removeToken();
      router.push('/');
    }
  };

  const refreshUser = async () => {
      await checkAuth();
  };

  return { user, loading, logout, refreshUser, isAuthenticated: !!user };
}
