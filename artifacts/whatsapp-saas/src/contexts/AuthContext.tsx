import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

const STORAGE_KEYS = {
  TOKEN: 'flowbot_token',
  USER: 'flowbot_user',
  REMEMBER_ME: 'flowbot_remember_me',
};

interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<User>;
  updateUser: (data: Partial<User>) => void;
}

const FAKE_CREDENTIALS = {
  email: 'joao@empresa.com',
  password: '12345678',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateToken(): string {
  return 'fake_token_' + Math.random().toString(36).substring(2);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));

    const isValid =
      data.email === FAKE_CREDENTIALS.email &&
      data.password === FAKE_CREDENTIALS.password;

    if (!isValid) return false;

    const fakeUser: User = {
      id: '1',
      name: 'João Silva',
      email: data.email,
      avatar: null,
      companyId: 'company_1',
      role: 'admin',
      plan: 'pro',
    };

    const token = generateToken();
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fakeUser));
    if (data.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    }

    setUser(fakeUser);
    return true;
  };

  const register = async (data: RegisterData): Promise<User> => {
    await new Promise((r) => setTimeout(r, 1000));

    const newUser: User = {
      id: 'user_' + Date.now(),
      name: data.name + ' ' + data.lastName,
      email: data.email,
      avatar: null,
      companyId: null,
      role: 'admin',
      plan: 'free',
    };

    const token = generateToken();
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, register, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
