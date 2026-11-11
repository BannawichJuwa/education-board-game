import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserAccount } from '../types';
import { api, ApiError, getToken, setToken, TeacherDto, toUserAccount } from '../api/serverSync';

/**
 * FR-01: teacher accounts are handled by the Spring Boot API (/api/auth).
 * The API returns a login token which is sent with every request.
 */
type Result = { success: boolean; error?: string };

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => Promise<Result>;
  register: (username: string, name: string, password: string) => Promise<Result>;
  logout: () => void;
  deleteAccount: (password?: string) => Promise<Result>;
}

const ACTIVE_USER_STORAGE_KEY = 'education_board_game_active_user_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : 'network_error');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Old versions stored accounts with plain-text passwords in the browser: remove them.
      localStorage.removeItem('education_board_game_users_v2');
      localStorage.removeItem('education_board_game_active_user_v2');
      const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      return saved && getToken() ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const remember = (user: UserAccount | null) => {
    setCurrentUser(user);
    try {
      if (user) localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  // On start: check that the saved token is still valid.
  useEffect(() => {
    if (!getToken()) return;
    api<TeacherDto>('/auth/me')
      .then((t) => remember(toUserAccount(t)))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setToken(null);
          remember(null);
        }
      });
  }, []);

  const login = async (username: string, password: string): Promise<Result> => {
    try {
      const res = await api<{ token: string; teacher: TeacherDto }>('/auth/login', 'POST', { username, password });
      setToken(res.token);
      remember(toUserAccount(res.teacher));
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  };

  const register = async (username: string, name: string, password: string): Promise<Result> => {
    try {
      const res = await api<{ token: string; teacher: TeacherDto }>('/auth/register', 'POST', { username, name, password });
      setToken(res.token);
      remember(toUserAccount(res.teacher));
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  };

  const logout = () => {
    setToken(null);
    remember(null);
  };

  const deleteAccount = async (password?: string): Promise<Result> => {
    try {
      await api('/auth/me', 'DELETE', { password: password ?? '' });
      logout();
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users: [], login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
