import { Alert, Platform } from 'react-native';

/**
 * Brand-themed notifications. When NotifyHost is mounted (app root) all
 * notify()/confirmAction() calls render Fixa-styled toasts and dialogs.
 * If the host is not mounted yet we fall back to the platform primitives
 * so nothing is silently lost.
 */
let host = null;

export const registerNotifyHost = (instance) => {
  host = instance;
};

export const notify = (title, message, kind = 'info') => {
  if (host) {
    host.showToast({ title, message, kind });
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }

  Alert.alert(title, message);
};

export const confirmAction = (title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') =>
  new Promise((resolve) => {
    if (host) {
      host.showConfirm({ title, message, confirmLabel, cancelLabel, resolve });
      return;
    }

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
