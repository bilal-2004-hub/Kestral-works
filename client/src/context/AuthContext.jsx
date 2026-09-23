import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const [sessionPassword, setSessionPassword] = useState(() => {
    try {
      return sessionStorage.getItem('session_client_pass') || '';
    } catch {
      return '';
    }
  });

  const updateSessionPassword = useCallback((newPass) => {
    setSessionPassword(newPass || '');
    try {
      if (newPass) {
        sessionStorage.setItem('session_client_pass', newPass);
      } else {
        sessionStorage.removeItem('session_client_pass');
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
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          // Fetch synced profile from backend
          const res = await authApi.me();
          if (res?.data) {
            setUser(res.data);
            setStatus('authenticated');
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
          return;
        }
      }

      // If no Firebase user, attempt legacy refresh session check
      try {
        const { data } = await authApi.refresh();
        applySession(data);
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
          const nextUser = res?.data || {
            _id: firebaseUser.uid,
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            role: firebaseUser.email?.includes('admin') ? 'admin' : 'client',
          };
          applySession({ user: nextUser, accessToken: token });
          updateSessionPassword(payload.password);
          authApi.recordLogin({ portal: 'client_portal', loginMethod: 'firebase_auth' }).catch(() => {});
          return nextUser;
        } catch (firebaseErr) {
          // 2. Fallback to backend API login
          const { data } = await authApi.login(payload);
          applySession(data);
          updateSessionPassword(payload.password);
          return data.user;
        }
      },
      register: async (payload) => {
        try {
          const firebaseUser = await registerWithEmail(
            payload.email,
            payload.password,
            payload.name
          );
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          const res = await authApi.register(payload);
          const nextUser = res?.data?.user || res?.data || {
            _id: firebaseUser.uid,
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: payload.name,
            role: 'client',
          };
          applySession({ user: nextUser, accessToken: token });
          updateSessionPassword(payload.password);
          return nextUser;
        } catch (firebaseErr) {
          const { data } = await authApi.register(payload);
          applySession(data);
          updateSessionPassword(payload.password);
          return data.user;
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
