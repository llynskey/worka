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

/**
 * Cross-platform confirmation dialog. Resolves true when the user confirms.
 * Web uses window.confirm; native uses a two-button Alert.
 */
export const confirmAction = (title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') =>
  new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(message ? `${title}\n\n${message}` : title)
          : false;
      resolve(ok);
      return;
    }

    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

export default notify;
