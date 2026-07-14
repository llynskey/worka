import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert. React Native Web's Alert.alert is a silent no-op,
 * so on web we fall back to window.alert to guarantee the user sees
 * confirmations and errors.
 */
export const notify = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }

  Alert.alert(title, message);
};

export default notify;
