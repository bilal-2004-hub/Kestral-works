import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../services/endpoints.js';
import { setAccessToken, setSessionLostHandler } from '../services/api.js';
import {
  onAuthChange,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  resetPasswordEmail,
} from '../firebase/auth.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const isRegisteringRef = useRef(false);
  const [sessionPassword, setSessionPassword] = useState(() => {
    try {
      return (
        sessionStorage.getItem('session_client_pass') ||
        localStorage.getItem('client_portal_last_pass') ||
        ''
      );
    } catch {
      return '';
    }
  });

  const updateSessionPassword = useCallback((newPass, email) => {
    setSessionPassword(newPass || '');
    try {
      if (newPass) {
        sessionStorage.setItem('session_client_pass', newPass);
        localStorage.setItem('client_portal_last_pass', newPass);
        if (email) {
          localStorage.setItem(`client_portal_pass_${email.toLowerCase().trim()}`, newPass);
        }
      } else {
        sessionStorage.removeItem('session_client_pass');
        localStorage.removeItem('client_portal_last_pass');
        if (email) {
          localStorage.removeItem(`client_portal_pass_${email.toLowerCase().trim()}`);
        }
      }
    } catch {}
  }, []);

  const applySession = useCallback(({ user: nextUser, accessToken }) => {
    if (accessToken) setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
    updateSessionPassword('');
  }, [updateSessionPassword]);

  useEffect(() => {
    setSessionLostHandler(clearSession);

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (isRegisteringRef.current) return;
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          // Fetch synced profile from backend
          const res = await authApi.me();
          // /auth/me returns { data: { user: {...} } } so unwrap the nested user
          const profile = res?.data?.user || res?.data || null;
          if (profile) {
            setUser(profile);
            setStatus('authenticated');
            if (profile.email) {
              try {
                const saved = localStorage.getItem(`client_portal_pass_${profile.email.toLowerCase().trim()}`);
                if (saved) setSessionPassword(saved);
              } catch {}
            }
            return;
          }
        } catch (err) {
          // If profile fetch fails, still set basic auth user
          setUser({
            _id: firebaseUser.uid,
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            role: firebaseUser.email?.includes('admin') ? 'admin' : 'client',
          });
          setStatus('authenticated');
          if (firebaseUser.email) {
            try {
              const saved = localStorage.getItem(`client_portal_pass_${firebaseUser.email.toLowerCase().trim()}`);
              if (saved) setSessionPassword(saved);
            } catch {}
          }
          return;
        }
      }

      // If no Firebase user, attempt legacy refresh session check
      try {
        const { data } = await authApi.refresh();
        applySession(data);
        if (data?.user?.email) {
          try {
            const saved = localStorage.getItem(`client_portal_pass_${data.user.email.toLowerCase().trim()}`);
            if (saved) setSessionPassword(saved);
          } catch {}
        }
      } catch {
        clearSession();
      }
    });

    return () => unsubscribe();
  }, [applySession, clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      sessionPassword,
      updateSessionPassword,
      isAuthenticated: status === 'authenticated',
      isStaff: user?.role === 'admin' || user?.role === 'manager',
      login: async (payload) => {
        // 1. Try Firebase Auth first
        try {
          const firebaseUser = await loginWithEmail(payload.email, payload.password);
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          const res = await authApi.me();
          // /auth/me returns { data: { user: {...} } } so unwrap the nested user
          const nextUser = res?.data?.user || res?.data || {
            _id: firebaseUser.uid,
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            role: firebaseUser.email?.includes('admin') ? 'admin' : 'client',
          };
          applySession({ user: nextUser, accessToken: token });
          updateSessionPassword(payload.password, payload.email);
          authApi.recordLogin({ portal: 'client_portal', loginMethod: 'firebase_auth' }).catch(() => {});
          return nextUser;
        } catch (firebaseErr) {
          // 2. Fallback to backend API login
          const { data } = await authApi.login(payload);
          applySession(data);
          updateSessionPassword(payload.password, payload.email);
          return data.user;
        }
      },
      register: async (payload) => {
        isRegisteringRef.current = true;
        try {
          let firebaseUser = null;
          try {
            firebaseUser = await registerWithEmail(
              payload.email,
              payload.password,
              payload.name
            );
          } catch (fbErr) {
            // If Firebase client-side creation fails (e.g. email exists or offline), let backend handle or throw
          }

          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken();
              setAccessToken(token);
            } catch {}
          }

          await authApi.register(payload);

          // Account created successfully. Sign out so user is redirected to login page to sign in
          try {
            await logoutUser();
          } catch {}
          try {
            await authApi.logout();
          } catch {}
          clearSession();
          return { success: true };
        } catch (err) {
          try {
            await logoutUser();
          } catch {}
          try {
            await authApi.logout();
          } catch {}
          clearSession();
          throw err;
        } finally {
          setTimeout(() => {
            isRegisteringRef.current = false;
          }, 500);
        }
      },
      resetPassword: async (payload) => {
        try {
          await resetPasswordEmail(payload.email);
        } catch {}
        try {
          await authApi.forgotPassword(payload.email);
        } catch {}
      },
      logout: async () => {
        try {
          await logoutUser();
        } catch {}
        try {
          await authApi.logout();
        } catch {}
        clearSession();
      },
      updateUser: (patch) => setUser((current) => ({ ...current, ...patch })),
    }),
    [user, status, sessionPassword, updateSessionPassword, applySession, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
