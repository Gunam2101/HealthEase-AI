import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ExplanationLevel } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  profile: UserProfile;
  explanationLevel: ExplanationLevel;
  setExplanationLevel: (level: ExplanationLevel) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_demo',
  user_id: 'usr_demo',
  full_name: 'Guna',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  preferred_language: 'en',
  explanation_level: 'General Public',
  voice_speed: 1.0,
  voice_gender: 'neutral',
  high_contrast: false,
  reduced_motion: false
};

const AuthContext = createContext<AuthContextType>({
  profile: DEFAULT_PROFILE,
  explanationLevel: 'General Public',
  setExplanationLevel: () => {},
  updateProfile: async () => {},
  isLoading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [explanationLevel, setExplanationLevelState] = useState<ExplanationLevel>('General Public');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await api.getProfile();
        setProfile(p);
        setExplanationLevelState(p.explanation_level || 'General Public');
      } catch (err) {
        console.warn('Using local profile state');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const setExplanationLevel = (level: ExplanationLevel) => {
    setExplanationLevelState(level);
    setProfile(prev => ({ ...prev, explanation_level: level }));
    api.updateProfile({ explanation_level: level }).catch(() => {});
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await api.updateProfile(updates);
    setProfile(updated);
    if (updated.explanation_level) {
      setExplanationLevelState(updated.explanation_level);
    }
  };

  return (
    <AuthContext.Provider value={{
      profile,
      explanationLevel,
      setExplanationLevel,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
