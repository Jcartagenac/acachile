// Hook para integrar accountService con AuthContext
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { accountService } from '../services/accountService';

export const useAccountService = () => {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    // Initialize accountService with AuthContext
    if (user) {
      accountService.setAuthContext({ user, updateUser });
    }
  }, [user, updateUser]);

  return accountService;
};