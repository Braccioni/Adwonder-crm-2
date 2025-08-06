import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Bypass authentication - create a mock user for open access
    const initializeAuth = async () => {
      try {
        // Create a mock user to bypass authentication
         const mockUser: User = {
           id: 'mock-user-id',
           email: 'admin@gestionale.com',
           nome: 'Admin',
           cognome: 'Gestionale',
           ruolo: 'owner',
           approved: true,
           last_login: new Date().toISOString(),
           created_at: new Date().toISOString(),
         };
        
        setState({
           user: mockUser,
           isAuthenticated: !!mockUser,
           isLoading: false,
         });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();

    // Auth state change listener disabled for open access mode
    // No cleanup needed since we're not subscribing to auth changes
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Bypass login - always succeed with mock user
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate a brief loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
       id: 'mock-user-id',
       email: credentials.email,
       nome: 'Admin',
       cognome: 'Gestionale',
       ruolo: 'owner',
       approved: true,
       last_login: new Date().toISOString(),
       created_at: new Date().toISOString(),
     };
    
    setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (userData: RegisterData) => {
    // Bypass registration - always succeed with mock user
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate a brief loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: 'mock-user-id',
      email: userData.email,
      nome: userData.nome,
      cognome: userData.cognome,
      ruolo: userData.ruolo,
      approved: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    // Bypass logout - keep user always authenticated for open access
    console.log('Logout disabled - gestionale in modalità aperta');
    // Do nothing - keep the user authenticated
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) throw new Error('No user logged in');
    
    try {
      const updatedUser = await authService.updateProfile(state.user.id, updates);
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};