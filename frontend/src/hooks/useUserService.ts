// Hook para integrar userService con AuthContext
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

export const useUserService = () => {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    // Initialize userService with AuthContext
    if (user) {
      userService.setAuthContext({ user, updateUser });
    }
  }, [user, updateUser]);

  return userService;
};