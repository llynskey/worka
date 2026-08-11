import { useContext, useState } from 'react';
import { api, getErrorMessage } from '../api/workaApi';
import notify from './notify';
import { AuthContext } from '../auth/AuthContext';

/**
 * One account, two workspaces. The API flips the account type, guarantees the
 * matching profile exists, and returns a fresh token whose role claim drives
 * which workspace renders. Shared by the drawer toggle (pro side), the
 * "Become a professional" card in customer Settings, and the pro setup gate's
 * "I don't want to be a professional" opt-out.
 */
export default function useSwitchMode() {
  const { signInWithToken } = useContext(AuthContext);
  const [switching, setSwitching] = useState(false);

  const switchMode = async () => {
    try {
      setSwitching(true);
      const response = await api.post('/account/switchMode');
      const token = response?.data?.token;
      if (!token) {
        notify('Could not switch just now', 'Please try again.');
        return;
      }
      await signInWithToken(token);
    } catch (error) {
      notify('Could not switch just now', getErrorMessage(error, 'Please try again.'));
    } finally {
      setSwitching(false);
    }
  };

  return { switching, switchMode };
}
