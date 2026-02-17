import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api'; 

interface AuthContextData {
  signed: boolean;
  user: any | null;
  signIn(credentials: any): Promise<void>;
  signOut(): void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageUser = await AsyncStorage.getItem('@TaskApp:user');
        const storageToken = await AsyncStorage.getItem('@TaskApp:token');

        if (storageUser && storageToken) {
          setUser(JSON.parse(storageUser));
        }
      } catch (e) {
        console.error("Erro ao carregar dados do storage", e);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const signIn = async (credentials: any) => {
    try {
      setLoading(true); 

      const data = await authService.login(credentials);
      const { accessToken, usuario } = data;

      await AsyncStorage.setItem('@TaskApp:user', JSON.stringify(usuario));
      await AsyncStorage.setItem('@TaskApp:token', accessToken); 

      setUser(usuario);
    } catch (error) {
      console.error("Erro no processo de login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await AsyncStorage.clear();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() { return useContext(AuthContext); }