import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Property } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  properties: Property[];
  activeProperty: Property | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchProperty: (propId: number) => void;
  refreshProperties: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('staydesk_token'));
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProperties(data.properties || []);

      const savedPropId = localStorage.getItem('staydesk_active_prop');
      const found = data.properties?.find((p) => String(p.id) === savedPropId) || data.properties?.[0] || null;
      setActiveProperty(found);
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { token: newToken, user: newUser } = await api.login(email, pass);
      localStorage.setItem('staydesk_token', newToken);
      setToken(newToken);
      setUser(newUser);

      // fetch properties & profile
      const data = await api.getMe();
      setProperties(data.properties || []);
      const defaultProp = data.properties?.[0] || null;
      setActiveProperty(defaultProp);
      if (defaultProp) {
        localStorage.setItem('staydesk_active_prop', String(defaultProp.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('staydesk_token');
    localStorage.removeItem('staydesk_active_prop');
    setToken(null);
    setUser(null);
    setProperties([]);
    setActiveProperty(null);
  };

  const switchProperty = (propId: number) => {
    const p = properties.find((item) => item.id === propId);
    if (p) {
      setActiveProperty(p);
      localStorage.setItem('staydesk_active_prop', String(p.id));
    }
  };

  const refreshProperties = async () => {
    try {
      const props = await api.getProperties();
      setProperties(props);
      if (activeProperty) {
        const updated = props.find((p) => p.id === activeProperty.id) || props[0] || null;
        setActiveProperty(updated);
      } else if (props.length > 0) {
        setActiveProperty(props[0]);
      }
    } catch (err) {
      console.error('Error refreshing properties:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        properties,
        activeProperty,
        loading,
        login,
        logout,
        switchProperty,
        refreshProperties,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
