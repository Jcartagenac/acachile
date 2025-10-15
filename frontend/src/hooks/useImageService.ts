// Hook para integrar imageService con AuthContext
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { imageService } from '../services/imageService';

export const useImageService = () => {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    // Initialize imageService with AuthContext
    if (user) {
      imageService.setAuthContext({ user, updateUser });
    }
  }, [user, updateUser]);

  return imageService;
};